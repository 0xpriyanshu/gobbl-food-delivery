import React, { useState, useEffect, useRef } from 'react';
import { Truck, MapPin, Store, Clock, Navigation } from 'lucide-react';

const EnhancedDeliveryMap = ({ activeDelivery, prepTime, deliveryTime }) => {
  const [deliveryTrucks, setDeliveryTrucks] = useState([]);
  const [trafficLights, setTrafficLights] = useState([]);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [deliveryStatus, setDeliveryStatus] = useState('');
  const animationRef = useRef(null);
  const progressRef = useRef(0);
  const currentPathRef = useRef([]);
  const currentStepRef = useRef(0);

  const LOCATIONS = {
    restaurant: { x: 20, y: 20 },
    delivery: activeDelivery ? { x: activeDelivery.location.x, y: activeDelivery.location.y } : null,
    trafficLightPositions: [
      { x: 50, y: 20 },
      { x: 50, y: 50 },
      { x: 20, y: 50 },
      { x: 80, y: 50 },
    ],
  };

  const ROADS = [
    { start: { x: 20, y: 20 }, end: { x: 80, y: 20 } },
    { start: { x: 20, y: 50 }, end: { x: 80, y: 50 } },
    { start: { x: 20, y: 80 }, end: { x: 80, y: 80 } },
    { start: { x: 20, y: 20 }, end: { x: 20, y: 80 } },
    { start: { x: 50, y: 20 }, end: { x: 50, y: 80 } },
    { start: { x: 80, y: 20 }, end: { x: 80, y: 80 } },
  ];

  // Enhanced path finding to ensure truck follows roads
  const findPathOnRoads = (start, end) => {
    // First find the nearest road points to start and end
    const path = [];
    let current = start;
    
    // If we need to change x position first
    if (current.x !== end.x) {
      // Move to correct x position along horizontal road
      path.push({ x: end.x, y: current.y });
      current = path[path.length - 1];
    }
    
    // Then move vertically to destination
    if (current.y !== end.y) {
      path.push({ x: current.x, y: end.y });
    }
    
    // Add final destination
    path.push(end);
    
    return path;
  };

  const animateDelivery = (path) => {
    if (!path || path.length < 2) return;

    const ANIMATION_DURATION = deliveryTime; // Total animation time
    const STEPS_PER_SECOND = 60;
    const TOTAL_STEPS = (ANIMATION_DURATION / 1000) * STEPS_PER_SECOND;
    const STEP_DURATION = ANIMATION_DURATION / TOTAL_STEPS;

    let step = 0;
    let currentSegment = 0;

    const animate = () => {
      const progress = step / TOTAL_STEPS;
      
      if (progress >= 1) {
        setDeliveryStatus('Delivered');
        setEstimatedTime(0);
        return;
      }

      // Calculate position along the current path segment
      const segmentProgress = (progress * path.length) - currentSegment;
      if (segmentProgress >= 1) {
        currentSegment++;
      }

      if (currentSegment < path.length - 1) {
        const start = path[currentSegment];
        const end = path[currentSegment + 1];
        const segmentPosition = Math.min(1, segmentProgress);

        const x = start.x + (end.x - start.x) * segmentPosition;
        const y = start.y + (end.y - start.y) * segmentPosition;

        setDeliveryTrucks(trucks =>
          trucks.map(truck => ({
            ...truck,
            x,
            y,
            status: 'delivering'
          }))
        );

        const remainingTime = Math.ceil((1 - progress) * (deliveryTime / 1000 / 60));
        setEstimatedTime(remainingTime);
        
        step++;
        animationRef.current = setTimeout(animate, STEP_DURATION);
      }
    };

    animate();
  };

  useEffect(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }

    if (activeDelivery && LOCATIONS.delivery) {
      setDeliveryTrucks([
        { id: 1, x: LOCATIONS.restaurant.x, y: LOCATIONS.restaurant.y, status: 'idle' }
      ]);
      
      const path = findPathOnRoads(LOCATIONS.restaurant, LOCATIONS.delivery);
      setDeliveryStatus('Starting delivery');
      
      setTimeout(() => {
        animateDelivery(path);
      }, 500);
    } else {
      setDeliveryTrucks([
        { id: 1, x: LOCATIONS.restaurant.x, y: LOCATIONS.restaurant.y, status: 'idle' }
      ]);
      setDeliveryStatus('');
      setEstimatedTime(0);
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [activeDelivery]);

  // Initialize trucks and traffic lights
  useEffect(() => {
    setDeliveryTrucks([
      { id: 1, x: LOCATIONS.restaurant.x, y: LOCATIONS.restaurant.y, status: 'idle' },
    ]);

    const lights = LOCATIONS.trafficLightPositions.map((pos, index) => ({
      id: index,
      x: pos.x,
      y: pos.y,
      state: 'green',
    }));
    setTrafficLights(lights);

    // Traffic light cycle
    const interval = setInterval(() => {
      setTrafficLights(prevLights =>
        prevLights.map(light => ({
          ...light,
          state: light.state === 'green' ? 'red' : 'green',
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Calculate distance between two points
  const calculateDistance = (point1, point2) => {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
  };

  // Check if a point is near a traffic light
  const isNearTrafficLight = (point) => {
    return trafficLights.some(light =>
      calculateDistance(point, { x: light.x, y: light.y }) < 2
    );
  };

  // Get traffic light state at a point
  const getTrafficLightState = (point) => {
    const light = trafficLights.find(light =>
      calculateDistance(point, { x: light.x, y: light.y }) < 2
    );
    return light ? light.state : null;
  };

  // Improved path finding with traffic consideration
  const findOptimalPath = (start, end) => {
    const queue = [{ pos: start, path: [start], cost: 0 }];
    const visited = new Set();

    while (queue.length > 0) {
      queue.sort((a, b) => a.cost - b.cost);
      const current = queue.shift();

      const posKey = `${current.pos.x},${current.pos.y}`;
      if (visited.has(posKey)) continue;
      visited.add(posKey);

      if (calculateDistance(current.pos, end) < 1) {
        return current.path;
      }

      // Find connected roads
      ROADS.forEach(road => {
        let nextPos = null;

        if (Math.abs(road.start.x - current.pos.x) < 1 &&
            Math.abs(road.start.y - current.pos.y) < 1) {
          nextPos = road.end;
        } else if (Math.abs(road.end.x - current.pos.x) < 1 &&
                   Math.abs(road.end.y - current.pos.y) < 1) {
          nextPos = road.start;
        }

        if (nextPos) {
          const trafficDelay = isNearTrafficLight(nextPos) &&
                             getTrafficLightState(nextPos) === 'red' ? 20 : 0;

          const newCost = current.cost +
                         calculateDistance(current.pos, nextPos) +
                         trafficDelay;

          queue.push({
            pos: nextPos,
            path: [...current.path, nextPos],
            cost: newCost
          });
        }
      });
    }

    return [start, end]; // Fallback direct path
  };


  // Handle new delivery
  useEffect(() => {
    if (activeDelivery) {
      const optimalPath = findOptimalPath(LOCATIONS.restaurant, LOCATIONS.delivery);
      setDeliveryStatus('Starting delivery');
      animateDelivery(optimalPath);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [activeDelivery]);

  return (
    <div className="relative w-full h-96 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
      <div className="absolute top-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg z-10">
        <h3 className="text-white font-bold mb-2">Delivery Status</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-white text-sm">ETA: {estimatedTime} mins</span>
          </div>
          <div className="flex items-center space-x-2">
            <Navigation className="w-4 h-4 text-green-400" />
            <span className="text-white text-sm">{deliveryStatus}</span>
          </div>
        </div>
      </div>

      <svg className="absolute inset-0" width="100%" height="100%">
        {ROADS.map((road, index) => (
          <g key={index}>
            <line
              x1={`${road.start.x}%`}
              y1={`${road.start.y}%`}
              x2={`${road.end.x}%`}
              y2={`${road.end.y}%`}
              stroke="#374151"
              strokeWidth="20"
              strokeLinecap="round"
            />
            <line
              x1={`${road.start.x}%`}
              y1={`${road.start.y}%`}
              x2={`${road.end.x}%`}
              y2={`${road.end.y}%`}
              stroke="white"
              strokeWidth="2"
              strokeDasharray="5,10"
              className="opacity-30"
            />
          </g>
        ))}
      </svg>

      {trafficLights.map((light) => (
        <div
          key={light.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${light.x}%`, top: `${light.y}%` }}
        >
          <div className="w-6 h-12 bg-gray-800 rounded-full flex flex-col items-center justify-around p-1">
            <div
              className={`w-4 h-4 rounded-full ${
                light.state === 'red' ? 'bg-red-500 animate-pulse' : 'bg-red-900'
              }`}
            />
            <div
              className={`w-4 h-4 rounded-full ${
                light.state === 'green' ? 'bg-green-500 animate-pulse' : 'bg-green-900'
              }`}
            />
          </div>
        </div>
      ))}

      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${LOCATIONS.restaurant.x}%`, top: `${LOCATIONS.restaurant.y}%` }}
      >
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
          <Store className="w-6 h-6 text-white" />
        </div>
        <span className="absolute top-12 left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-green-500 text-white rounded-full text-xs">
          Restaurant
        </span>
      </div>

      {activeDelivery && LOCATIONS.delivery && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${LOCATIONS.delivery.x}%`, top: `${LOCATIONS.delivery.y}%` }}
        >
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <span className="absolute top-12 left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-blue-500 text-white rounded-full text-xs">
            Delivery Location
          </span>
        </div>
      )}

      {deliveryTrucks.map((truck) => (
        <div
          key={truck.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
          style={{
            left: `${truck.x}%`,
            top: `${truck.y}%`,
            transform: `translate(-50%, -50%) rotate(${truck.rotation}deg)`,
          }}
        >
          <div
            className={`w-12 h-12 ${
              truck.status === 'delivering' ? 'bg-red-500' : 'bg-gray-500'
            } rounded-xl flex items-center justify-center shadow-lg`}
          >
            <Truck className="w-6 h-6 text-white" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default EnhancedDeliveryMap;
