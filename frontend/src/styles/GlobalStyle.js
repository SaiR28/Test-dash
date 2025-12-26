import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    height: 100vh;
    height: -webkit-fill-available;
    overflow-x: hidden;
    scroll-behavior: smooth;
  }

  body {
    font-family: ${props => props.theme.fonts.primary};
    font-size: ${props => props.theme.fontSizes.base};
    font-weight: ${props => props.theme.fontWeights.normal};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
    line-height: 1.5;
    height: 100vh;
    min-height: -webkit-fill-available;
    overflow-x: hidden;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  #root {
    height: 100vh;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${props => props.theme.fonts.primary};
    font-weight: ${props => props.theme.fontWeights.semibold};
    line-height: 1.25;
    margin: 0;
  }

  h1 { font-size: ${props => props.theme.fontSizes['2xl']}; }
  h2 { font-size: ${props => props.theme.fontSizes.xl}; }
  h3 { font-size: ${props => props.theme.fontSizes.lg}; }
  h4 { font-size: ${props => props.theme.fontSizes.base}; }

  p { margin: 0; line-height: 1.5; }

  code {
    font-family: ${props => props.theme.fonts.mono};
    font-size: ${props => props.theme.fontSizes.sm};
  }

  a {
    text-decoration: none;
    color: inherit;
    transition: ${props => props.theme.transitions.fast};
  }

  button {
    cursor: pointer;
    border: none;
    outline: none;
    font-family: ${props => props.theme.fonts.primary};
    font-weight: ${props => props.theme.fontWeights.medium};
    transition: ${props => props.theme.transitions.fast};
  }

  input, select, textarea {
    font-family: ${props => props.theme.fonts.primary};
    font-size: ${props => props.theme.fontSizes.sm};
    outline: none;
  }

  /* Compact Card Grid - for sensor cards, stats */
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: ${props => props.theme.spacing.sm};
    width: 100%;
  }

  /* Sensor Grid - for reservoir sensors */
  .sensor-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: ${props => props.theme.spacing.sm};
    width: 100%;
  }

  /* Climate Grid - for DHT sensors */
  .climate-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: ${props => props.theme.spacing.xs};
    width: 100%;
  }

  /* Large screens - 6 columns */
  @media (min-width: ${props => props.theme.breakpoints.xl}) {
    .card-grid {
      grid-template-columns: repeat(6, 1fr);
    }
    .sensor-grid {
      grid-template-columns: repeat(5, 1fr);
    }
    .climate-grid {
      grid-template-columns: repeat(8, 1fr);
    }
  }

  /* Medium screens - 4 columns */
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    .card-grid {
      grid-template-columns: repeat(4, 1fr);
    }
    .sensor-grid {
      grid-template-columns: repeat(4, 1fr);
    }
    .climate-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  /* Small screens - 3 columns */
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    .card-grid {
      grid-template-columns: repeat(3, 1fr);
    }
    .sensor-grid {
      grid-template-columns: repeat(3, 1fr);
    }
    .climate-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  /* Mobile - 2 columns */
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    .card-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .sensor-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .climate-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Prevent content overflow */
  .container {
    max-width: 100%;
    overflow-x: auto;
  }

  /* Mobile-specific styles */
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    body {
      font-size: ${props => props.theme.fontSizes.sm};
    }

    h1 { font-size: ${props => props.theme.fontSizes.xl}; }
    h2 { font-size: ${props => props.theme.fontSizes.lg}; }
    h3 { font-size: ${props => props.theme.fontSizes.base}; }
    h4 { font-size: ${props => props.theme.fontSizes.sm}; }

    /* Larger touch targets on mobile */
    button, a, input, select {
      min-height: 44px;
    }

    /* Prevent zoom on input focus (iOS) */
    input, select, textarea {
      font-size: 16px !important;
    }
  }

  /* Safe area padding for notched devices */
  @supports (padding: env(safe-area-inset-bottom)) {
    .safe-area-bottom {
      padding-bottom: env(safe-area-inset-bottom);
    }
  }

  /* Hide scrollbar but allow scrolling */
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }

  /* Smooth scroll container */
  .scroll-container {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
`;

export default GlobalStyle;
