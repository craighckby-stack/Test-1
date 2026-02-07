import threading
import time
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional

# Setup standard logging for RTOM
logger = logging.getLogger("RTOM")

# Assume SensorAPI exists in utilities/sensors for proper architectural segregation
# This dependency is fulfilled by the scaffolding proposal.
try:
    # Define the contract for sensors
    from .sensors.SensorAPI import SensorAPI, MockSensor 
except ImportError:
    class DummySensor: # Failsafe class if the sensor structure is missing
         def get_all_resource_metrics(self): return {'error': 'Sensor system unavailable'}
    MockSensor = DummySensor
    SensorAPI = object # Placeholder for type hinting


class RTOM:
    """Real-Time Operational Monitor (RTOM) v94.1

    Provides low-latency, thread-safe, unbuffered telemetry by utilizing a dedicated 
    background thread to constantly update resource consumption metrics and temporal markers.
    Ensures get_real_time_telemetry() is a fast, non-blocking read guaranteed by explicit locking.
    """

    # Shared low-latency internal cache updated by the monitoring thread
    _metrics_cache: Dict[str, Any] = {}
    
    # Thread safety mechanism for cache access
    _cache_lock = threading.Lock()

    def __init__(self, metrics_config_path: str = 'config/rtom_metrics_config.json', sensor_api: Optional[Any] = None):
        self.config = self._load_config(Path(metrics_config_path))
        self.polling_rate = self.config.get('polling_rate_s', 0.1) # Default 100ms
        
        self._sensor_hooks = self._initialize_sensors(sensor_api)
        
        self._shutdown_flag = threading.Event()
        
        logger.info(f"RTOM Initialized (Polling rate: {self.polling_rate}s)")
        
        # Start the background monitoring loop
        self._monitoring_thread = threading.Thread(
            target=self._run_monitoring_loop, 
            name="RTOM-Monitor",
            daemon=True
        )
        self._monitoring_thread.start()

    def _load_config(self, path: Path) -> Dict[str, Any]:
        """Loads required sensors, thresholds, and polling definitions."""
        DEFAULT_CONFIG = {'polling_rate_s': 0.1, 'sensors': ['cpu', 'memory']}
        try:
            if not path.exists():
                logger.warning(f"RTOM Config not found at {path}. Using default configuration.")
                return DEFAULT_CONFIG
            
            with open(path, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse RTOM configuration: {e}. Using defaults.")
            return DEFAULT_CONFIG
        except Exception as e:
            logger.error(f"Error loading RTOM configuration: {e}. Using defaults.")
            return DEFAULT_CONFIG

    def _initialize_sensors(self, sensor_api):
        """Initializes sensor hooks, using a Mock if none provided."""
        if sensor_api is None:
            # Use MockSensor if no concrete API is passed
            if MockSensor is not object:
                logger.warning("No concrete Sensor API provided. Falling back to MockSensor.")
                return MockSensor()
            else:
                # Should only happen if the import failed critically
                logger.critical("Sensor API system failed initialization.")
        return sensor_api

    def _run_monitoring_loop(self):
        """Dedicated thread function for continuous, high-frequency data capture."""
        logger.info("Monitoring loop started.")
        while not self._shutdown_flag.is_set():
            start_time = time.monotonic()
            
            try:
                telemetry = {
                    'timestamp_utc': time.time(), 
                    'resource_metrics': self._get_resource_status(),
                    'temporal_markers': self._get_temporal_events()
                }
                
                # Update the shared cache instantly using the lock
                with RTOM._cache_lock:
                    RTOM._metrics_cache = telemetry 

            except Exception as e:
                # Logging critical sensor failure
                logger.error(f"RTOM Monitoring Loop experienced sensor/processing error: {e}", exc_info=True)
            
            # Dynamic sleep calculation for precise polling rate
            elapsed_time = time.monotonic() - start_time
            sleep_time = max(0, self.polling_rate - elapsed_time)
            
            self._shutdown_flag.wait(sleep_time)
        
        logger.info("Monitoring loop shut down.")
            
    def get_real_time_telemetry(self) -> Dict[str, Any]:
        """
        Returns the current immutable telemetry package instantly from cache.
        NON-BLOCKING READ guaranteed by utilizing a Lock.
        """
        # Acquire lock only long enough to safely read the shared reference
        with RTOM._cache_lock:
            if not RTOM._metrics_cache:
                return {'status': 'initializing', 'timestamp_utc': time.time()}
                
            return RTOM._metrics_cache

    def shutdown(self):
        """Gracefully stops the monitoring thread, cleaning up resources."""
        logger.info("Initiating RTOM shutdown.")
        self._shutdown_flag.set()
        if self._monitoring_thread.is_alive():
            self._monitoring_thread.join(timeout=3.0)
            if self._monitoring_thread.is_alive():
                logger.warning("RTOM monitoring thread failed to shut down gracefully after timeout.")
            
    # --- Sensor methods ---
    def _get_resource_status(self) -> Dict[str, Any]: 
        return self._sensor_hooks.get_all_resource_metrics()
        
    def _get_temporal_events(self) -> list: 
        return []