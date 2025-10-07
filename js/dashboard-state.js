/**
 * Global State Manager for Storm Dashboard Visualizations
 * Handles shared parameters across multiple Vega-Lite visualizations
 */

class DashboardState {
  constructor() {
    this.state = {
      currentYear: 2010,
      startYear: 2005,
      endYear: 2025
    };
    this.views = new Map();
    this.listeners = new Map();
  }

  /**
   * Initialize the dashboard state with DOM controls
   */
  init() {
    const yearSlider = document.getElementById('globalYear');
    const yearDisplay = document.getElementById('yearDisplay');
    
    if (yearSlider && yearDisplay) {
      // Set initial values
      yearSlider.value = this.state.currentYear;
      yearDisplay.textContent = this.state.currentYear;
      
      // Add event listener for year changes
      yearSlider.addEventListener('input', (event) => {
        this.updateYear(parseInt(event.target.value));
      });
    }

    console.log('Dashboard state initialized', this.state);
  }

  /**
   * Update the current year and propagate to all views
   */
  updateYear(newYear) {
    if (newYear >= this.state.startYear && newYear <= this.state.endYear) {
      const oldYear = this.state.currentYear;
      this.state.currentYear = newYear;
      
      // Update display
      const yearDisplay = document.getElementById('yearDisplay');
      if (yearDisplay) {
        yearDisplay.textContent = newYear;
      }
      
      // Update all registered views
      this.updateAllViews();
      
      // Trigger custom listeners
      this.triggerListeners('yearChange', { oldYear, newYear });
      
      console.log(`Year updated: ${oldYear} -> ${newYear}`);
    }
  }

  /**
   * Register a Vega-Lite view to be controlled by global state
   */
  registerView(name, view) {
    if (view && typeof view.signal === 'function') {
      this.views.set(name, view);
      
      // Set initial state
      view.signal('globalYear', this.state.currentYear);
      view.run();
      
      console.log(`View '${name}' registered`);
    } else {
      console.error(`Invalid view provided for '${name}'`);
    }
  }

  /**
   * Unregister a view
   */
  unregisterView(name) {
    this.views.delete(name);
    console.log(`View '${name}' unregistered`);
  }

  /**
   * Update all registered views with current state
   */
  updateAllViews() {
    this.views.forEach((view, name) => {
      try {
        if (view && typeof view.signal === 'function') {
          view.signal('globalYear', this.state.currentYear);
          view.run();
        }
      } catch (error) {
        console.error(`Error updating view '${name}':`, error);
      }
    });
  }

  /**
   * Add a custom event listener
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove a custom event listener
   */
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Trigger custom event listeners
   */
  triggerListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error);
        }
      });
    }
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get a specific state value
   */
  getValue(key) {
    return this.state[key];
  }

  /**
   * Set a state value and update views if necessary
   */
  setValue(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    
    if (key === 'currentYear') {
      this.updateAllViews();
    }
    
    this.triggerListeners('stateChange', { key, oldValue, newValue: value });
  }

  /**
   * Prepare a Vega-Lite specification with global parameters
   */
  prepareSpec(spec) {
    // Clone the specification to avoid modifying the original
    const preparedSpec = JSON.parse(JSON.stringify(spec));
    
    // Ensure params array exists
    if (!preparedSpec.params) {
      preparedSpec.params = [];
    }
    
    // Add or update globalYear parameter
    const globalYearParam = preparedSpec.params.find(p => p.name === 'globalYear');
    if (globalYearParam) {
      globalYearParam.value = this.state.currentYear;
    } else {
      preparedSpec.params.unshift({
        name: 'globalYear',
        value: this.state.currentYear
      });
    }
    
    return preparedSpec;
  }

  /**
   * Load and embed a Vega-Lite visualization
   */
  async loadVisualization(containerId, specPath, viewName) {
    try {
      const response = await fetch(specPath);
      const spec = await response.json();
      
      const preparedSpec = this.prepareSpec(spec);
      const result = await vegaEmbed(containerId, preparedSpec);
      
      this.registerView(viewName, result.view);
      
      console.log(`Visualization '${viewName}' loaded successfully`);
      return result;
      
    } catch (error) {
      console.error(`Error loading visualization '${viewName}':`, error);
      throw error;
    }
  }
}

// Create global instance
const GlobalDashboardState = new DashboardState();

// Make it available globally
window.GlobalDashboardState = GlobalDashboardState;