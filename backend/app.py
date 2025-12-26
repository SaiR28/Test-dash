# Flask + SQLite Backend for Hydroponics Monitoring System
from flask import Flask, request, jsonify, g, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import sqlite3
import json
import time
import os
import base64
from datetime import datetime, timedelta
import threading
import random
from queue import Queue
from werkzeug.utils import secure_filename

# Thread-safe queue for camera uploads (handles unlimited concurrent uploads)
camera_upload_queue = Queue()
QUEUE_WORKER_COUNT = 2  # Number of workers processing uploads

app = Flask(__name__)
app.config['SECRET_KEY'] = 'hydroponics_secret_key_2024'
CORS(app, origins="*")
socketio = SocketIO(app, cors_allowed_origins="*")

# Configuration
DATABASE = 'hydroponics.db'
UPLOAD_FOLDER = 'camera_images'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Create upload directory
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db():
    """Get database connection with timeout for concurrent access"""
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE, timeout=30)
        g.db.row_factory = sqlite3.Row
    return g.db

def get_db_direct():
    """Get a direct database connection (for background workers)"""
    conn = sqlite3.connect(DATABASE, timeout=30)
    conn.row_factory = sqlite3.Row
    return conn

def close_db(error):
    """Close database connection"""
    db = g.pop('db', None)
    if db is not None:
        db.close()

@app.teardown_appcontext
def close_db_handler(error):
    close_db(error)

def init_db():
    """Initialize database with tables"""
    with app.app_context():
        db = get_db()

        # Enable WAL mode for better concurrent write performance
        db.execute('PRAGMA journal_mode=WAL')
        db.execute('PRAGMA synchronous=NORMAL')  # Faster writes, still safe with WAL

        # Hydro Units table
        db.execute('''
            CREATE TABLE IF NOT EXISTS hydro_units (
                unit_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Sensor readings table
        db.execute('''
            CREATE TABLE IF NOT EXISTS sensor_readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                unit_id TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                ph REAL,
                tds INTEGER,
                turbidity INTEGER,
                water_temp REAL,
                water_level INTEGER,
                climate_data TEXT,
                FOREIGN KEY (unit_id) REFERENCES hydro_units (unit_id)
            )
        ''')

        # Relay states table
        db.execute('''
            CREATE TABLE IF NOT EXISTS relay_states (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                unit_id TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                lights TEXT DEFAULT 'OFF',
                fans TEXT DEFAULT 'OFF',
                pump TEXT DEFAULT 'OFF',
                FOREIGN KEY (unit_id) REFERENCES hydro_units (unit_id)
            )
        ''')

        # Schedules table
        db.execute('''
            CREATE TABLE IF NOT EXISTS schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                unit_id TEXT NOT NULL,
                schedule_type TEXT NOT NULL,
                schedule_data TEXT NOT NULL,
                active BOOLEAN DEFAULT 1,
                control_mode TEXT DEFAULT 'timer',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (unit_id) REFERENCES hydro_units (unit_id)
            )
        ''')

        # Add control_mode column if it doesn't exist (for existing databases)
        try:
            db.execute('ALTER TABLE schedules ADD COLUMN control_mode TEXT DEFAULT "timer"')
        except sqlite3.OperationalError:
            # Column already exists
            pass

        # Room sensors table
        db.execute('''
            CREATE TABLE IF NOT EXISTS room_sensors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                unit_id TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                temp REAL,
                humidity INTEGER,
                pressure INTEGER,
                iaq INTEGER,
                co2 INTEGER,
                ac_temp INTEGER,
                ac_mode TEXT
            )
        ''')

        # AC schedules table
        db.execute('''
            CREATE TABLE IF NOT EXISTS ac_schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hour TEXT NOT NULL,
                temperature INTEGER NOT NULL,
                active BOOLEAN DEFAULT 1,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Camera images table
        db.execute('''
            CREATE TABLE IF NOT EXISTS camera_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                camera_id TEXT NOT NULL,
                unit_id TEXT NOT NULL,
                level INTEGER NOT NULL,
                position INTEGER NOT NULL,
                image_path TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                file_size INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (unit_id) REFERENCES hydro_units (unit_id)
            )
        ''')

        # Camera status table
        db.execute('''
            CREATE TABLE IF NOT EXISTS camera_status (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                camera_id TEXT UNIQUE NOT NULL,
                unit_id TEXT NOT NULL,
                last_image_timestamp INTEGER,
                total_images INTEGER DEFAULT 0,
                status TEXT DEFAULT 'offline',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (unit_id) REFERENCES hydro_units (unit_id)
            )
        ''')

        # Insert default hydro units
        units = [
            ('DWC1', 'Deep Water Culture 1', 'DWC'),
            ('DWC2', 'Deep Water Culture 2', 'DWC'),
            ('NFT', 'Nutrient Film Technique', 'NFT'),
            ('AERO', 'Aeroponic System', 'Aeroponic'),
            ('TROUGH', 'Trough Based System', 'Trough')
        ]

        for unit in units:
            db.execute('INSERT OR IGNORE INTO hydro_units (unit_id, name, type) VALUES (?, ?, ?)', unit)

        # Insert default AC schedule (24 hours)
        for hour in range(24):
            hour_str = f"{hour:02d}"
            temp = 24  # Default temperature
            db.execute('INSERT OR IGNORE INTO ac_schedules (hour, temperature) VALUES (?, ?)', (hour_str, temp))

        db.commit()

# API Routes

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Docker/load balancers"""
    return jsonify({"status": "healthy", "timestamp": time.time()})

@app.route('/units/<unit_id>/sensors', methods=['GET'])
def get_unit_sensors(unit_id):
    """Get latest sensor data for a hydro unit"""
    db = get_db()

    # Get latest sensor reading
    sensor = db.execute('''
        SELECT * FROM sensor_readings
        WHERE unit_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
    ''', (unit_id,)).fetchone()

    if not sensor:
        # Return mock data if no readings
        return jsonify({
            "unit_id": unit_id,
            "timestamp": int(time.time()),
            "reservoir": {
                "ph": 6.2,
                "tds": 950,
                "turbidity": 12,
                "water_temp": 22.4,
                "water_level": 78
            },
            "climate": {
                "L11": {"temp": 24.1, "humidity": 70},
                "L12": {"temp": 24.4, "humidity": 71},
                "L21": {"temp": 23.9, "humidity": 69},
                "L22": {"temp": 24.0, "humidity": 68},
                "L31": {"temp": 24.2, "humidity": 72},
                "L32": {"temp": 24.5, "humidity": 71},
                "L41": {"temp": 25.1, "humidity": 74},
                "L42": {"temp": 25.0, "humidity": 73}
            }
        })

    climate_data = json.loads(sensor['climate_data']) if sensor['climate_data'] else {}

    return jsonify({
        "unit_id": unit_id,
        "timestamp": sensor['timestamp'],
        "reservoir": {
            "ph": sensor['ph'],
            "tds": sensor['tds'],
            "turbidity": sensor['turbidity'],
            "water_temp": sensor['water_temp'],
            "water_level": sensor['water_level']
        },
        "climate": climate_data
    })

@app.route('/units/<unit_id>/relays', methods=['GET'])
def get_unit_relays(unit_id):
    """Get current relay states for a hydro unit"""
    db = get_db()

    relay = db.execute('''
        SELECT * FROM relay_states
        WHERE unit_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
    ''', (unit_id,)).fetchone()

    if not relay:
        # Return default states
        return jsonify({
            "unit_id": unit_id,
            "timestamp": int(time.time()),
            "relays": {
                "lights": "OFF",
                "fans": "OFF",
                "pump": "OFF"
            }
        })

    return jsonify({
        "unit_id": unit_id,
        "timestamp": relay['timestamp'],
        "relays": {
            "lights": relay['lights'],
            "fans": relay['fans'],
            "pump": relay['pump']
        }
    })

@app.route('/units/<unit_id>/relay', methods=['POST'])
def update_unit_relay(unit_id):
    """Update relay state for a hydro unit - optionally switches to manual mode"""
    data = request.get_json()
    db = get_db()
    timestamp = int(time.time())

    # Get current states
    current = db.execute('''
        SELECT * FROM relay_states
        WHERE unit_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
    ''', (unit_id,)).fetchone()

    lights = data.get('lights', current['lights'] if current else 'OFF')
    fans = data.get('fans', current['fans'] if current else 'OFF')
    pump = data.get('pump', current['pump'] if current else 'OFF')

    # Insert new relay state
    db.execute('''
        INSERT INTO relay_states (unit_id, timestamp, lights, fans, pump)
        VALUES (?, ?, ?, ?, ?)
    ''', (unit_id, timestamp, lights, fans, pump))

    # Only switch specific relay to manual mode if explicitly toggling (not mode change)
    # Check which relay was changed and update only that relay's mode
    relay_changed = None
    if 'lights' in data and (not current or data['lights'] != current['lights']):
        relay_changed = 'lights'
    elif 'fans' in data and (not current or data['fans'] != current['fans']):
        relay_changed = 'fans'
    elif 'pump' in data and (not current or data['pump'] != current['pump']):
        relay_changed = 'pump'

    # Update control mode for the specific relay that was changed
    if relay_changed:
        schedule = db.execute('''
            SELECT id, schedule_data FROM schedules
            WHERE unit_id = ? AND active = 1
            ORDER BY id DESC LIMIT 1
        ''', (unit_id,)).fetchone()

        if schedule:
            schedule_data = json.loads(schedule['schedule_data'])
            if 'control_modes' not in schedule_data:
                schedule_data['control_modes'] = {'lights': 'timer', 'fans': 'timer', 'pump': 'timer'}
            schedule_data['control_modes'][relay_changed] = 'manual'

            db.execute('''
                UPDATE schedules SET schedule_data = ? WHERE id = ?
            ''', (json.dumps(schedule_data), schedule['id']))

    db.commit()

    # Broadcast update via WebSocket
    socketio.emit('relay_update', {
        'unit_id': unit_id,
        'timestamp': timestamp,
        'relays': {'lights': lights, 'fans': fans, 'pump': pump}
    })

    return jsonify({
        "unit_id": unit_id,
        "timestamp": timestamp,
        "relays": {"lights": lights, "fans": fans, "pump": pump}
    })

@app.route('/units/<unit_id>/schedule', methods=['GET'])
def get_unit_schedule(unit_id):
    """Get schedule for a hydro unit"""
    db = get_db()

    schedules = db.execute('''
        SELECT * FROM schedules
        WHERE unit_id = ? AND active = 1
    ''', (unit_id,)).fetchall()

    result = {}
    # Default per-relay control modes
    control_modes = {'lights': 'timer', 'fans': 'timer', 'pump': 'timer'}

    for schedule in schedules:
        schedule_data = json.loads(schedule['schedule_data'])
        # Extract control_modes if present in schedule_data
        if 'control_modes' in schedule_data:
            control_modes.update(schedule_data['control_modes'])
            del schedule_data['control_modes']
        result.update(schedule_data)

    result['control_modes'] = control_modes
    return jsonify(result)

@app.route('/units/<unit_id>/schedule', methods=['POST'])
def update_unit_schedule(unit_id):
    """Update schedule for a hydro unit"""
    data = request.get_json()
    db = get_db()

    # Get existing schedule to preserve control_modes
    existing = db.execute('''
        SELECT schedule_data FROM schedules
        WHERE unit_id = ? AND active = 1
        ORDER BY id DESC LIMIT 1
    ''', (unit_id,)).fetchone()

    existing_control_modes = {'lights': 'timer', 'fans': 'timer', 'pump': 'timer'}
    if existing:
        existing_data = json.loads(existing['schedule_data'])
        if 'control_modes' in existing_data:
            existing_control_modes = existing_data['control_modes']

    # Preserve or update control_modes
    control_modes = data.pop('control_modes', existing_control_modes)

    # If updating a specific relay's schedule, set that relay to timer mode
    if 'lights' in data and isinstance(data['lights'], dict):
        control_modes['lights'] = 'timer'
    if 'fans' in data and isinstance(data['fans'], dict):
        control_modes['fans'] = 'timer'
    if 'pump_cycle' in data:
        control_modes['pump'] = 'timer'

    # Store control_modes in schedule_data
    schedule_data = {**data, 'control_modes': control_modes}

    # Deactivate old schedules
    db.execute('UPDATE schedules SET active = 0 WHERE unit_id = ?', (unit_id,))

    # Insert new schedule
    db.execute('''
        INSERT INTO schedules (unit_id, schedule_type, schedule_data, control_mode)
        VALUES (?, ?, ?, ?)
    ''', (unit_id, 'time_schedule', json.dumps(schedule_data), 'timer'))
    db.commit()

    return jsonify({**data, 'control_modes': control_modes})


@app.route('/units/<unit_id>/control_mode', methods=['POST'])
def update_control_mode(unit_id):
    """Update control mode for a specific relay"""
    data = request.get_json()
    db = get_db()

    relay_type = data.get('relay')  # 'lights', 'fans', or 'pump'
    mode = data.get('mode')  # 'manual' or 'timer'

    if relay_type not in ['lights', 'fans', 'pump']:
        return jsonify({'error': 'Invalid relay type'}), 400
    if mode not in ['manual', 'timer']:
        return jsonify({'error': 'Invalid mode'}), 400

    # Get existing schedule
    schedule = db.execute('''
        SELECT id, schedule_data FROM schedules
        WHERE unit_id = ? AND active = 1
        ORDER BY id DESC LIMIT 1
    ''', (unit_id,)).fetchone()

    if schedule:
        schedule_data = json.loads(schedule['schedule_data'])
        if 'control_modes' not in schedule_data:
            schedule_data['control_modes'] = {'lights': 'timer', 'fans': 'timer', 'pump': 'timer'}
        schedule_data['control_modes'][relay_type] = mode

        db.execute('''
            UPDATE schedules SET schedule_data = ? WHERE id = ?
        ''', (json.dumps(schedule_data), schedule['id']))
        db.commit()

        return jsonify({
            'unit_id': unit_id,
            'relay': relay_type,
            'mode': mode,
            'control_modes': schedule_data['control_modes']
        })
    else:
        # Create new schedule with control mode
        schedule_data = {
            'control_modes': {'lights': 'timer', 'fans': 'timer', 'pump': 'timer'}
        }
        schedule_data['control_modes'][relay_type] = mode

        db.execute('''
            INSERT INTO schedules (unit_id, schedule_type, schedule_data, control_mode)
            VALUES (?, ?, ?, ?)
        ''', (unit_id, 'time_schedule', json.dumps(schedule_data), 'timer'))
        db.commit()

        return jsonify({
            'unit_id': unit_id,
            'relay': relay_type,
            'mode': mode,
            'control_modes': schedule_data['control_modes']
        })


@app.route('/room/front/sensors', methods=['GET'])
def get_front_room_sensors():
    """Get front room sensor data"""
    db = get_db()

    sensor = db.execute('''
        SELECT * FROM room_sensors
        WHERE unit_id = 'ROOM_FRONT'
        ORDER BY timestamp DESC
        LIMIT 1
    ''', ).fetchone()

    if not sensor:
        return jsonify({
            "unit_id": "ROOM_FRONT",
            "timestamp": int(time.time()),
            "bme": {
                "temp": 25.4,
                "humidity": 62,
                "pressure": 1007,
                "iaq": 132
            },
            "co2": 780
        })

    return jsonify({
        "unit_id": "ROOM_FRONT",
        "timestamp": sensor['timestamp'],
        "bme": {
            "temp": sensor['temp'],
            "humidity": sensor['humidity'],
            "pressure": sensor['pressure'],
            "iaq": sensor['iaq']
        },
        "co2": sensor['co2']
    })

@app.route('/room/back/sensors', methods=['GET'])
def get_back_room_sensors():
    """Get back room sensor data with AC info"""
    db = get_db()

    sensor = db.execute('''
        SELECT * FROM room_sensors
        WHERE unit_id = 'ROOM_BACK'
        ORDER BY timestamp DESC
        LIMIT 1
    ''', ).fetchone()

    if not sensor:
        return jsonify({
            "unit_id": "ROOM_BACK",
            "timestamp": int(time.time()),
            "bme": {
                "temp": 25.4,
                "humidity": 62,
                "pressure": 1007,
                "iaq": 132
            },
            "co2": 780,
            "ac": {
                "current_set_temp": 24,
                "mode": "COOL"
            }
        })

    return jsonify({
        "unit_id": "ROOM_BACK",
        "timestamp": sensor['timestamp'],
        "bme": {
            "temp": sensor['temp'],
            "humidity": sensor['humidity'],
            "pressure": sensor['pressure'],
            "iaq": sensor['iaq']
        },
        "co2": sensor['co2'],
        "ac": {
            "current_set_temp": sensor['ac_temp'],
            "mode": sensor['ac_mode']
        }
    })

@app.route('/room/back/ac_schedule', methods=['GET'])
def get_ac_schedule():
    """Get AC hourly temperature schedule"""
    db = get_db()

    schedules = db.execute('''
        SELECT hour, temperature FROM ac_schedules
        WHERE active = 1
        ORDER BY hour
    ''').fetchall()

    ac_schedule = {}
    for schedule in schedules:
        ac_schedule[schedule['hour']] = schedule['temperature']

    return jsonify({"ac_schedule": ac_schedule})

@app.route('/room/back/ac_schedule', methods=['POST'])
def update_ac_schedule():
    """Update AC hourly temperature schedule"""
    data = request.get_json()
    db = get_db()

    ac_schedule = data.get('ac_schedule', {})

    for hour, temp in ac_schedule.items():
        db.execute('''
            UPDATE ac_schedules
            SET temperature = ?, updated_at = CURRENT_TIMESTAMP
            WHERE hour = ?
        ''', (temp, hour))

    db.commit()
    return jsonify(data)

# Camera API endpoints
@app.route('/cameras/<unit_id>', methods=['GET'])
def get_unit_cameras(unit_id):
    """Get camera status for a hydro unit"""
    db = get_db()

    cameras = db.execute('''
        SELECT camera_id, last_image_timestamp, total_images, status
        FROM camera_status
        WHERE unit_id = ?
        ORDER BY camera_id
    ''', (unit_id,)).fetchall()

    camera_list = []
    for camera in cameras:
        camera_list.append({
            'camera_id': camera['camera_id'],
            'last_image_timestamp': camera['last_image_timestamp'],
            'total_images': camera['total_images'],
            'status': camera['status']
        })

    return jsonify({
        'unit_id': unit_id,
        'cameras': camera_list
    })

@app.route('/cameras/<camera_id>/images', methods=['GET'])
def get_camera_images(camera_id):
    """Get recent images from a specific camera"""
    db = get_db()
    limit = request.args.get('limit', 10, type=int)

    images = db.execute('''
        SELECT id, camera_id, timestamp, image_path, file_size
        FROM camera_images
        WHERE camera_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
    ''', (camera_id, limit)).fetchall()

    image_list = []
    for image in images:
        image_list.append({
            'id': image['id'],
            'camera_id': image['camera_id'],
            'timestamp': image['timestamp'],
            'image_path': image['image_path'],
            'file_size': image['file_size'],
            'url': f'/camera_images/{os.path.basename(image["image_path"])}'
        })

    return jsonify({
        'camera_id': camera_id,
        'images': image_list
    })

@app.route('/cameras/<camera_id>/upload', methods=['POST'])
def upload_camera_image(camera_id):
    """Upload a new camera image - uses queue for database writes to handle 20+ concurrent uploads"""
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No image file selected'}), 400

    if file and allowed_file(file.filename):
        timestamp = int(time.time())

        # Parse camera ID to get unit, level, position
        # Format: UNITL<level><position> (e.g., DWCL11, NFTL23)
        try:
            unit_id = camera_id[:camera_id.index('L')]
            level_pos = camera_id[camera_id.index('L')+1:]
            level = int(level_pos[0])
            position = int(level_pos[1])
        except (ValueError, IndexError):
            return jsonify({'error': 'Invalid camera_id format. Expected: UNITL<level><position>'}), 400

        # Generate unique filename with microseconds to prevent collisions
        unique_suffix = f"{timestamp}_{int(time.time() * 1000000) % 1000000}"
        filename = f"{camera_id}_{unique_suffix}.jpg"
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        # Save file immediately (fast, non-blocking)
        file.save(filepath)
        file_size = os.path.getsize(filepath)

        # Queue database write (processed async by background worker)
        camera_upload_queue.put({
            'camera_id': camera_id,
            'unit_id': unit_id,
            'level': level,
            'position': position,
            'filepath': filepath,
            'timestamp': timestamp,
            'file_size': file_size
        })

        # Log queued upload
        print(f"Camera {camera_id} upload queued at {timestamp} (queue size: {camera_upload_queue.qsize()})")

        # Return immediately - DB write happens async
        return jsonify({
            'message': 'Image uploaded successfully',
            'camera_id': camera_id,
            'timestamp': timestamp,
            'image_url': f'/camera_images/{filename}',
            'queued': True
        })

    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/units/<unit_id>/cameras/latest', methods=['GET'])
def get_unit_latest_images(unit_id):
    """Get latest image from each camera in a unit"""
    db = get_db()

    images = db.execute('''
        SELECT DISTINCT ci.camera_id, ci.timestamp, ci.image_path, ci.level, ci.position
        FROM camera_images ci
        INNER JOIN (
            SELECT camera_id, MAX(timestamp) as max_timestamp
            FROM camera_images
            WHERE unit_id = ?
            GROUP BY camera_id
        ) latest ON ci.camera_id = latest.camera_id AND ci.timestamp = latest.max_timestamp
        ORDER BY ci.level, ci.position
    ''', (unit_id,)).fetchall()

    camera_grid = {}
    for image in images:
        level = f"L{image['level']}"
        if level not in camera_grid:
            camera_grid[level] = {}

        camera_grid[level][f"pos{image['position']}"] = {
            'camera_id': image['camera_id'],
            'timestamp': image['timestamp'],
            'image_url': f'/camera_images/{os.path.basename(image["image_path"])}'
        }

    return jsonify({
        'unit_id': unit_id,
        'camera_grid': camera_grid
    })

# Serve camera images
@app.route('/camera_images/<filename>')
def serve_camera_image(filename):
    """Serve camera images"""
    from flask import send_from_directory
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/cameras/latest', methods=['GET'])
def get_latest_camera_image():
    """Get the most recently uploaded camera image"""
    db = get_db()

    image = db.execute('''
        SELECT camera_id, unit_id, level, position, image_path, timestamp, file_size
        FROM camera_images
        ORDER BY timestamp DESC
        LIMIT 1
    ''').fetchone()

    if not image:
        return jsonify({'error': 'No images found'}), 404

    return jsonify({
        'camera_id': image['camera_id'],
        'unit_id': image['unit_id'],
        'level': image['level'],
        'position': image['position'],
        'timestamp': image['timestamp'],
        'file_size': image['file_size'],
        'image_url': f'/camera_images/{os.path.basename(image["image_path"])}'
    })


@app.route('/cameras/status', methods=['GET'])
def get_all_cameras_status():
    """Get status of all cameras across all units"""
    db = get_db()

    cameras = db.execute('''
        SELECT camera_id, unit_id, last_image_timestamp, total_images, status
        FROM camera_status
        ORDER BY unit_id, camera_id
    ''').fetchall()

    camera_summary = {}
    for camera in cameras:
        unit_id = camera['unit_id']
        if unit_id not in camera_summary:
            camera_summary[unit_id] = []

        camera_summary[unit_id].append({
            'camera_id': camera['camera_id'],
            'last_image_timestamp': camera['last_image_timestamp'],
            'total_images': camera['total_images'],
            'status': camera['status']
        })

    return jsonify({
        'timestamp': int(time.time()),
        'total_units': len(camera_summary),
        'total_cameras': len(cameras),
        'units': camera_summary
    })

# Export endpoints
@app.route('/export/sensors/csv', methods=['GET'])
def export_sensors_csv():
    """Export sensor data as CSV"""
    import csv
    import io
    from datetime import datetime, timedelta

    unit = request.args.get('unit', 'ALL')
    date_range = request.args.get('range', 'last7days')
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')

    db = get_db()

    # Calculate date range
    end_time = int(time.time())
    if date_range == 'today':
        start_time = end_time - 86400  # 24 hours
    elif date_range == 'yesterday':
        start_time = end_time - 172800  # 48 hours
        end_time = end_time - 86400    # 24 hours ago
    elif date_range == 'last7days':
        start_time = end_time - (7 * 86400)  # 7 days
    elif date_range == 'last30days':
        start_time = end_time - (30 * 86400)  # 30 days
    elif date_range == 'thismonth':
        now = datetime.now()
        start_of_month = datetime(now.year, now.month, 1)
        start_time = int(start_of_month.timestamp())
    elif date_range == 'lastmonth':
        now = datetime.now()
        if now.month == 1:
            start_of_last_month = datetime(now.year - 1, 12, 1)
            end_of_last_month = datetime(now.year, 1, 1) - timedelta(days=1)
        else:
            start_of_last_month = datetime(now.year, now.month - 1, 1)
            end_of_last_month = datetime(now.year, now.month, 1) - timedelta(days=1)
        start_time = int(start_of_last_month.timestamp())
        end_time = int(end_of_last_month.timestamp())
    elif date_range == 'custom' and start_date and end_date:
        start_time = int(datetime.strptime(start_date, '%Y-%m-%d').timestamp())
        end_time = int(datetime.strptime(end_date, '%Y-%m-%d').timestamp()) + 86399  # End of day
    else:
        start_time = end_time - (7 * 86400)  # Default to last 7 days

    # Build query
    if unit == 'ALL':
        query = '''
            SELECT unit_id, timestamp, ph, tds, turbidity, water_temp, water_level, climate_data
            FROM sensor_readings
            WHERE timestamp BETWEEN ? AND ?
            ORDER BY timestamp DESC
        '''
        params = (start_time, end_time)
    else:
        query = '''
            SELECT unit_id, timestamp, ph, tds, turbidity, water_temp, water_level, climate_data
            FROM sensor_readings
            WHERE unit_id = ? AND timestamp BETWEEN ? AND ?
            ORDER BY timestamp DESC
        '''
        params = (unit, start_time, end_time)

    readings = db.execute(query, params).fetchall()

    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    header = ['Unit ID', 'Timestamp', 'DateTime', 'pH', 'TDS (ppm)', 'Turbidity (NTU)',
              'Water Temp (°C)', 'Water Level (%)', 'Climate Data']
    writer.writerow(header)

    # Write data
    for reading in readings:
        timestamp = reading['timestamp']
        dt = datetime.fromtimestamp(timestamp)

        row = [
            reading['unit_id'],
            timestamp,
            dt.strftime('%Y-%m-%d %H:%M:%S'),
            reading['ph'],
            reading['tds'],
            reading['turbidity'],
            reading['water_temp'],
            reading['water_level'],
            reading['climate_data'] or '{}'
        ]
        writer.writerow(row)

    output.seek(0)

    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename=sensor-data-{unit}-{date_range}.csv'}
    )

@app.route('/export/images/zip', methods=['GET'])
def export_images_zip():
    """Export camera images as ZIP"""
    import zipfile
    import io
    import glob
    from datetime import datetime, timedelta

    unit = request.args.get('unit', 'ALL')
    date_range = request.args.get('range', 'last7days')
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')

    db = get_db()

    # Calculate date range (same logic as CSV)
    end_time = int(time.time())
    if date_range == 'today':
        start_time = end_time - 86400
    elif date_range == 'yesterday':
        start_time = end_time - 172800
        end_time = end_time - 86400
    elif date_range == 'last7days':
        start_time = end_time - (7 * 86400)
    elif date_range == 'last30days':
        start_time = end_time - (30 * 86400)
    elif date_range == 'thismonth':
        now = datetime.now()
        start_of_month = datetime(now.year, now.month, 1)
        start_time = int(start_of_month.timestamp())
    elif date_range == 'lastmonth':
        now = datetime.now()
        if now.month == 1:
            start_of_last_month = datetime(now.year - 1, 12, 1)
            end_of_last_month = datetime(now.year, 1, 1) - timedelta(days=1)
        else:
            start_of_last_month = datetime(now.year, now.month - 1, 1)
            end_of_last_month = datetime(now.year, now.month, 1) - timedelta(days=1)
        start_time = int(start_of_last_month.timestamp())
        end_time = int(end_of_last_month.timestamp())
    elif date_range == 'custom' and start_date and end_date:
        start_time = int(datetime.strptime(start_date, '%Y-%m-%d').timestamp())
        end_time = int(datetime.strptime(end_date, '%Y-%m-%d').timestamp()) + 86399
    else:
        start_time = end_time - (7 * 86400)

    # Get image records from database
    if unit == 'ALL':
        query = '''
            SELECT camera_id, timestamp, image_path
            FROM camera_images
            WHERE timestamp BETWEEN ? AND ?
            ORDER BY camera_id, timestamp
        '''
        params = (start_time, end_time)
    else:
        query = '''
            SELECT camera_id, timestamp, image_path
            FROM camera_images
            WHERE camera_id LIKE ? AND timestamp BETWEEN ? AND ?
            ORDER BY camera_id, timestamp
        '''
        params = (f'{unit}%', start_time, end_time)

    images = db.execute(query, params).fetchall()

    if not images:
        return jsonify({'error': 'No images found for the specified criteria'}), 404

    # Create ZIP file in memory
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for image in images:
            camera_id = image['camera_id']
            timestamp = image['timestamp']
            image_path = image['image_path']

            # Extract unit from camera_id (e.g., DWC1L11 -> DWC1)
            unit_id = camera_id[:camera_id.index('L')] if 'L' in camera_id else 'UNKNOWN'

            # Create organized path in ZIP
            dt = datetime.fromtimestamp(timestamp)
            date_str = dt.strftime('%Y-%m-%d')
            time_str = dt.strftime('%H-%M-%S')

            zip_path = f"{unit_id}/{camera_id}/{date_str}/{camera_id}_{time_str}.jpg"

            # Add file to ZIP
            try:
                full_path = os.path.join(app.root_path, image_path)
                if os.path.exists(full_path):
                    zip_file.write(full_path, zip_path)
                else:
                    print(f"Warning: Image file not found: {full_path}")
            except Exception as e:
                print(f"Error adding image to ZIP: {e}")

    zip_buffer.seek(0)

    return Response(
        zip_buffer.read(),
        mimetype='application/zip',
        headers={'Content-Disposition': f'attachment; filename=camera-images-{unit}-{date_range}.zip'}
    )

# Settings endpoints
SETTINGS_FILE = 'settings.json'

def load_settings():
    """Load settings from file"""
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_settings(settings):
    """Save settings to file"""
    with open(SETTINGS_FILE, 'w') as f:
        json.dump(settings, f, indent=2)

@app.route('/settings/ranges', methods=['GET'])
def get_ranges():
    """Get safe ranges for sensors"""
    settings = load_settings()
    return jsonify({"ranges": settings.get('ranges', {})})

@app.route('/settings/ranges', methods=['POST'])
def update_ranges():
    """Update safe ranges for sensors"""
    data = request.get_json()
    settings = load_settings()
    settings['ranges'] = data.get('ranges', {})
    save_settings(settings)
    return jsonify({"message": "Ranges saved successfully", "ranges": settings['ranges']})

@app.route('/settings/clear-data', methods=['POST'])
def clear_data():
    """Clear sensor readings and historical data from the database"""
    db = get_db()
    try:
        # Clear sensor readings
        db.execute('DELETE FROM sensor_readings')
        # Clear room sensors
        db.execute('DELETE FROM room_sensors')
        # Clear camera images table (but not actual image files)
        db.execute('DELETE FROM camera_images')
        # Reset camera status
        db.execute('DELETE FROM camera_status')
        db.commit()
        return jsonify({"message": "Database cleared successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# WebSocket events
@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')
    emit('connected', {'data': 'Connected to NeuralKissan system'})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')

@socketio.on('join_unit')
def handle_join_unit(data):
    unit_id = data['unit_id']
    join_room(unit_id)
    emit('joined', {'unit_id': unit_id})

@socketio.on('leave_unit')
def handle_leave_unit(data):
    unit_id = data['unit_id']
    leave_room(unit_id)
    emit('left', {'unit_id': unit_id})

# Background task to simulate sensor data updates
def simulate_sensor_updates():
    """Background task to simulate sensor data updates"""
    while True:
        try:
            with app.app_context():
                db = get_db()
                timestamp = int(time.time())

                # Update hydro units
                unit_ids = ['DWC1', 'DWC2', 'NFT', 'AERO', 'TROUGH']
                for unit_id in unit_ids:

                    # Generate random sensor data
                    climate_data = {}
                    for level in [1, 2, 3, 4]:
                        for pos in [1, 2]:
                            key = f"L{level}{pos}"
                            climate_data[key] = {
                                "temp": round(random.uniform(22, 26), 1),
                                "humidity": random.randint(65, 75)
                            }

                    # Insert sensor reading
                    db.execute('''
                        INSERT INTO sensor_readings
                        (unit_id, timestamp, ph, tds, turbidity, water_temp, water_level, climate_data)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        unit_id, timestamp,
                        round(random.uniform(5.5, 7.0), 1),
                        random.randint(800, 1200),
                        random.randint(8, 20),
                        round(random.uniform(20, 25), 1),
                        random.randint(70, 90),
                        json.dumps(climate_data)
                    ))

                # Update room sensors
                for room in ['ROOM_FRONT', 'ROOM_BACK']:
                    ac_temp = random.randint(22, 26) if room == 'ROOM_BACK' else None
                    ac_mode = 'COOL' if room == 'ROOM_BACK' else None

                    db.execute('''
                        INSERT INTO room_sensors
                        (unit_id, timestamp, temp, humidity, pressure, iaq, co2, ac_temp, ac_mode)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        room, timestamp,
                        round(random.uniform(22, 28), 1),
                        random.randint(55, 70),
                        random.randint(1000, 1020),
                        random.randint(100, 200),
                        random.randint(400, 1000),
                        ac_temp, ac_mode
                    ))

                db.commit()

                # Simulate camera images every 5 minutes (300 seconds)
                if timestamp % 300 == 0:  # Every 5 minutes
                    # Generate mock camera images for each unit
                    unit_ids = ['DWC1', 'DWC2', 'NFT', 'AERO', 'TROUGH']
                    for unit_id in unit_ids:
                        # Each unit can have 1-8 cameras (simulating random presence)
                        num_cameras = random.randint(2, 6)

                        for i in range(num_cameras):
                            level = random.randint(1, 4)
                            position = random.randint(1, 2)
                            camera_id = f"{unit_id}L{level}{position}"

                            # Create mock image data (you would normally receive actual image)
                            mock_image_path = f"{UPLOAD_FOLDER}/mock_{camera_id}_{timestamp}.jpg"

                            # Insert camera image record
                            db.execute('''
                                INSERT INTO camera_images
                                (camera_id, unit_id, level, position, image_path, timestamp, file_size)
                                VALUES (?, ?, ?, ?, ?, ?, ?)
                            ''', (camera_id, unit_id, level, position, mock_image_path, timestamp, 1024))

                            # Update camera status
                            db.execute('''
                                INSERT OR REPLACE INTO camera_status
                                (camera_id, unit_id, last_image_timestamp, total_images, status, updated_at)
                                VALUES (?, ?, ?,
                                    COALESCE((SELECT total_images FROM camera_status WHERE camera_id = ?), 0) + 1,
                                    'online', CURRENT_TIMESTAMP)
                            ''', (camera_id, unit_id, timestamp, camera_id))

                            # Log camera simulation
                            print(f"Simulated camera {camera_id} image at {timestamp}")

                # Broadcast updates via WebSocket
                socketio.emit('sensor_update', {
                    'timestamp': timestamp,
                    'message': 'Sensor data updated'
                })

        except Exception as e:
            print(f"Error in sensor simulation: {e}")

        time.sleep(30)  # Update every 30 seconds


def camera_upload_worker(worker_id):
    """Background worker to process camera upload queue - handles DB writes sequentially"""
    print(f"Camera upload worker {worker_id} started")

    while True:
        try:
            # Block until an item is available
            upload_data = camera_upload_queue.get()

            if upload_data is None:  # Shutdown signal
                break

            # Get a direct database connection (not tied to request context)
            db = get_db_direct()

            try:
                camera_id = upload_data['camera_id']
                unit_id = upload_data['unit_id']
                level = upload_data['level']
                position = upload_data['position']
                filepath = upload_data['filepath']
                timestamp = upload_data['timestamp']
                file_size = upload_data['file_size']

                # Insert image record
                db.execute('''
                    INSERT INTO camera_images
                    (camera_id, unit_id, level, position, image_path, timestamp, file_size)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (camera_id, unit_id, level, position, filepath, timestamp, file_size))

                # Update camera status with proper locking
                db.execute('''
                    INSERT INTO camera_status (camera_id, unit_id, last_image_timestamp, total_images, status, updated_at)
                    VALUES (?, ?, ?, 1, 'online', CURRENT_TIMESTAMP)
                    ON CONFLICT(camera_id) DO UPDATE SET
                        last_image_timestamp = excluded.last_image_timestamp,
                        total_images = total_images + 1,
                        status = 'online',
                        updated_at = CURRENT_TIMESTAMP
                ''', (camera_id, unit_id, timestamp))

                db.commit()
                print(f"Worker {worker_id}: Saved camera {camera_id} image to DB")

                # Emit WebSocket event to notify frontend of new image
                socketio.emit('camera_image_uploaded', {
                    'camera_id': camera_id,
                    'unit_id': unit_id,
                    'level': level,
                    'position': position,
                    'timestamp': timestamp,
                    'image_url': f'/camera_images/{os.path.basename(filepath)}'
                })

            except Exception as e:
                print(f"Worker {worker_id}: Error saving to DB: {e}")
                db.rollback()
            finally:
                db.close()
                camera_upload_queue.task_done()

        except Exception as e:
            print(f"Worker {worker_id}: Queue error: {e}")


if __name__ == '__main__':
    # Initialize database
    init_db()

    # Start camera upload queue workers (handles 20+ concurrent uploads)
    for i in range(QUEUE_WORKER_COUNT):
        worker_thread = threading.Thread(target=camera_upload_worker, args=(i,))
        worker_thread.daemon = True
        worker_thread.start()
    print(f"Started {QUEUE_WORKER_COUNT} camera upload workers")

    # Start background sensor simulation
    sensor_thread = threading.Thread(target=simulate_sensor_updates)
    sensor_thread.daemon = True
    sensor_thread.start()

    # Run Flask app with SocketIO
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)