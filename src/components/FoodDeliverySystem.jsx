import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, ChefHat, Truck, Star, Flame, Clock, Navigation, Store, DollarSign } from 'lucide-react';
import Together from "together-ai";
import EnhancedDeliveryMap from './EnhancedDeliveryMap';


const together = new Together({
    apiKey: import.meta.env.VITE_TOGETHER_API_KEY
  });

const GobblDeliverySystem = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [state, setState] = useState({
    orders: [],
    trucks: Array(3).fill().map((_, i) => ({ 
      id: i + 1, 
      position: { x: 50, y: 50 }, 
      status: 'idle', 
      rotation: 0 
    })),
    messages: { consumer: [], delivery: [], restaurant: [], accounting: [] },
    reviews: [], 
    payments: { totalRevenue: 0, pendingPayments: 0, completedPayments: 0 }
  });

  useEffect(() => {
    const welcomeMessages = [
      {
        sender: "bot",
        text: "👋 Welcome to gobblHODL! I'm your personal pizza assistant."
      },
      {
        sender: "bot",
        text: "You can interact with me in several ways:"
      },
      {
        sender: "bot",
        text: "Ask for recommendations like 'I want a vegetarian pizza' or 'What's your spiciest pizza?'\n• Specify preferences like 'Show me pizzas under $15' or 'I want something with low calories'\n• Just tell me what you're craving, and I'll help you find the perfect pizza!"
      },
      {
        sender: "bot",
        text: "What kind of pizza are you in the mood for today? 🍕"
      }
    ];
    setMessages(welcomeMessages);
  }, []);

  const PREP_TIME = 8000;
  const DELIVERY_TIME = 10000;

  const pizzas = [
    {
      id: 1,
      name: "Margherita",
      price: 12.99,
      description: "Classic tomato and mozzarella",
      ingredients: ["Fresh Mozzarella", "Tomatoes", "Basil", "Olive Oil"],
      calories: 850,
      rating: 4.8,
      cookTime: "20 min",
      spicyLevel: 0,
      image: "https://via.placeholder.com/150?text=Margherita",
    },
    {
      id: 2,
      name: "Pepperoni",
      price: 14.99,
      description: "Spicy pepperoni with cheese",
      ingredients: ["Pepperoni", "Mozzarella", "Tomato Sauce"],
      calories: 1100,
      rating: 4.9,
      cookTime: "18 min",
      spicyLevel: 1,
      image: "https://via.placeholder.com/150?text=Pepperoni",
    },
    {
      id: 3,
      name: "Vegetarian",
      price: 13.99,
      description: "Mixed vegetables",
      ingredients: ["Bell Peppers", "Mushrooms", "Onions", "Olives"],
      calories: 780,
      rating: 4.7,
      cookTime: "22 min",
      spicyLevel: 0,
      image: "https://via.placeholder.com/150?text=Vegetarian",
    },
    {
      id: 4,
      name: "Hawaiian",
      price: 15.99,
      description: "Ham and pineapple",
      ingredients: ["Ham", "Pineapple", "Mozzarella", "Tomato Sauce"],
      calories: 950,
      rating: 4.6,
      cookTime: "20 min",
      spicyLevel: 0,
      image: "https://via.placeholder.com/150?text=Hawaiian",
    },
    {
      id: 5,
      name: "BBQ Chicken",
      price: 16.99,
      description: "Grilled chicken with BBQ sauce",
      ingredients: ["Chicken", "BBQ Sauce", "Red Onions", "Cilantro"],
      calories: 1020,
      rating: 4.8,
      cookTime: "25 min",
      spicyLevel: 1,
      image: "https://via.placeholder.com/150?text=BBQ+Chicken",
    },
    {
      id: 6,
      name: "Mushroom",
      price: 15.99,
      description: "Mixed mushrooms and truffle",
      ingredients: ["Mushroom Medley", "Truffle Oil", "Garlic", "Thyme"],
      calories: 880,
      rating: 4.8,
      cookTime: "21 min",
      spicyLevel: 0,
      image: "https://via.placeholder.com/150?text=Mushroom",
    },
    {
      id: 7,
      name: "Mediterranean",
      price: 16.99,
      description: "Mediterranean flavors",
      ingredients: ["Feta", "Olives", "Sun-dried Tomatoes", "Spinach"],
      calories: 920,
      rating: 4.6,
      cookTime: "24 min",
      spicyLevel: 0,
      image: "https://via.placeholder.com/150?text=Mediterranean",
    },
  ];

  const addMessage = useCallback((agent, message) => {
    setState((prev) => ({
      ...prev,
      messages: {
        ...prev.messages,
        [agent]: [...prev.messages[agent], { text: message, timestamp: new Date().toLocaleTimeString() }],
      },
    }));
  }, []);
  
  const getClosestRoadPoint = (x, y) => {
    // Get closest point on the road network
    const roads = [
      { y: 20 }, // Horizontal roads
      { y: 50 },
      { y: 80 },
      { x: 20 }, // Vertical roads
      { x: 50 },
      { x: 80 }
    ];
    
    // Find closest horizontal and vertical roads
    const closestHorizontal = roads.slice(0, 3)
      .reduce((closest, road) => 
        Math.abs(road.y - y) < Math.abs(closest.y - y) ? road : closest
      );
      
    const closestVertical = roads.slice(3)
      .reduce((closest, road) => 
        Math.abs(road.x - x) < Math.abs(closest.x - x) ? road : closest
      );
      
    return {
      x: closestVertical.x,
      y: closestHorizontal.y
    };
  };

  const handleOrder = useCallback((orderDetails) => {
    // Generate random delivery coordinates
    const rawX = Math.floor(Math.random() * (85 - 15 + 1)) + 15;
    const rawY = Math.floor(Math.random() * (85 - 15 + 1)) + 15;
  
    // Snap to nearest road intersection
    const deliveryLocation = getClosestRoadPoint(rawX, rawY);
    const orderId = Date.now();
  
    const newOrder = {
      id: orderId,
      ...orderDetails,
      location: deliveryLocation,
      status: 'preparing',
    };
  
    setState((prev) => ({
      ...prev,
      orders: [...prev.orders, newOrder],
      payments: {
        ...prev.payments,
        pendingPayments: prev.payments.pendingPayments + orderDetails.price,
      },
    }));
  
    // Send Consumer message
    addMessage("consumer", `New order received: ${newOrder.item}`);
  
    // Send Accounting message
    addMessage(
      "accounting",
      `Payment pending for ${orderDetails.item}: $${orderDetails.price.toFixed(2)}`
    );
  
    // Send Restaurant message
    addMessage("restaurant", `Preparing ${newOrder.item}`);
  
    // Update bot messages
    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: `Your order for ${newOrder.item} is being prepared.` },
    ]);
  
    // Start delivery after prep time
    setTimeout(() => {
      const deliveryOrder = { ...newOrder, status: "delivering" };
      setActiveDelivery(deliveryOrder);
  
      setState((prev) => ({
        ...prev,
        payments: {
          ...prev.payments,
          totalRevenue: prev.payments.totalRevenue + orderDetails.price,
          pendingPayments: prev.payments.pendingPayments - orderDetails.price,
          completedPayments: prev.payments.completedPayments + orderDetails.price,
        },
      }));
  
      addMessage("restaurant", `Order ready: ${orderDetails.item}`);
      addMessage("delivery", `Starting delivery for ${orderDetails.item}`);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `Your ${orderDetails.item} is out for delivery!`,
        },
      ]);
  
      // Complete delivery after delivery time
      setTimeout(() => {
        setActiveDelivery(null);
        setState((prev) => ({
          ...prev,
          orders: prev.orders.map((order) =>
            order.id === orderId
              ? { ...order, status: "delivered", awaitingReview: true }
              : order
          ),
        }));
  
        addMessage("delivery", `Delivery completed for ${orderDetails.item}!`);
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: `Your ${orderDetails.item} has been delivered. Enjoy your meal!` },
          {
            sender: "bot",
            text: `We'd love to hear your feedback! Please provide a rating (1-5) and a short review for your ${orderDetails.item}.`,
          },
        ]);
      }, DELIVERY_TIME);
    }, PREP_TIME);
  }, [addMessage]);

  const analyzePizzaRequest = async (userQuery) => {
    try {
      const systemPrompt = `You are a Pizza Recommendation Expert, acting as a friendly, knowledgeable waiter at a top pizza joint. When a customer asks for a pizza, your job is to recommend the best options based on their preferences. Make sure to sound friendly, relaxed, and conversational, like you're chatting about their perfect pizza choice. Also, you’ll need to analyze the request, considering dietary preferences, calorie counts, spiciness levels, price ranges, and any other criteria they mention.
  
  Available pizzas with details:
  ${JSON.stringify(pizzas, null, 2)}
  
  Rules:
  1. Only recommend pizzas from the given list
  2. Consider dietary preferences (vegetarian vs non-vegetarian)
  3. Factor in price ranges when mentioned
  4. Take calories into account for anyone looking to eat light or indulgent.
  5. Consider spiciness preferences – let me know if it’s too hot to handle.
  6. Match any ingredients or specific flavor preferences.
  7. Pay attention to dietary restrictions or allergies (if they mention any, like dairy-free, gluten-free, etc.).
  
  Return response in this exact JSON format:
  {
    "recommendations": [pizza_ids],
    "explanation": "very short explanation of why these pizzas were recommended",
    "criteria_matched": ["list of criteria that influenced the selection"]
  }
  
  For example, if someone asks for "vegetarian pizza with low calories", prioritize pizzas without meat and lower calorie counts.
  
  User query: ${userQuery}`;
  
      const response = await together.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuery }
        ],
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        temperature: 0.4,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        stop: ["<|eot_id|>", "<|eom_id|>"]
      });
  
      let result;
      try {
        const content = response.choices[0].message.content;
        // Find the JSON object in the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          console.error("No JSON found in response");
          return null;
        }
      } catch (e) {
        console.error("Failed to parse LLM response:", e);
        return null;
      }
  
      return result;
    } catch (error) {
      console.error("Error calling Together AI:", error);
      return null;
    }
  };


  const processReview = useCallback((input) => {
    const pendingReviewOrder = state.orders.find(order => order.awaitingReview);
    
    if (!pendingReviewOrder) {
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: "No active order found to review. Please try again." 
      }]);
      return;
    }

    const ratingMatch = input.match(/\b[1-5]\b/);
    const rating = ratingMatch ? parseInt(ratingMatch[0], 10) : null;
    const review = input.replace(/\b[1-5]\b/, "").trim();

    if (!rating || !review) {
      setMessages(prev => [...prev, {
        sender: "bot",
        text: "Please provide both a valid rating (1-5) and a review."
      }]);
      return;
    }

    setState(prev => ({
      ...prev,
      orders: prev.orders.map(order => 
        order.id === pendingReviewOrder.id 
          ? { ...order, awaitingReview: false }
          : order
      ),
      reviews: [...prev.reviews, {
        orderId: pendingReviewOrder.id,
        item: pendingReviewOrder.item,
        rating,
        review,
        timestamp: new Date().toLocaleString()
      }]
    }));

    setMessages(prev => [...prev, {
      sender: "bot",
      text: `Thank you for your ${rating}-star review of ${pendingReviewOrder.item}!`
    }]);
  }, [state.orders]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
  
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
  
    // Check if the bot is expecting a review
    const lastBotMessage = messages[messages.length - 1]?.text || "";
    if (lastBotMessage.includes("Please provide a rating")) {
      processReview(input);
      setInput("");
      return;
    }
  
    // Show typing indicator
    setMessages((prev) => [...prev, { sender: "bot", text: "Typing...", isTyping: true }]);
  
    try {
      const analysis = await analyzePizzaRequest(input);
      const suggestions = analysis?.recommendations 
        ? analysis.recommendations.map(id => pizzas.find(p => p.id === id)).filter(Boolean)
        : pizzas.slice(0, 4);

  
      // Remove typing indicator and add response
      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.isTyping);
        return [
          ...filtered,
          {
            sender: "bot",
            text: analysis?.explanation || "Here are some pizzas you might like:",
            suggestions,
          },
        ];
      });
    } catch (error) {
      console.error("Error processing request:", error);
      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.isTyping);
        return [
          ...filtered,
          {
            sender: "bot",
            text: "I apologize, but I encountered an error processing your request. Let me show you our popular options instead.",
            suggestions: pizzas.slice(0, 4),
          },
        ];
      });
    }
  
    setInput("");
  };

  // Attach keypress handler to input
  useEffect(() => {
    const inputField = document.getElementById('inputField');
    if (inputField) {
      inputField.addEventListener('keypress', handleKeyPress);
      return () => inputField.removeEventListener('keypress', handleKeyPress);
    }
  }, [handleKeyPress]);

  return (
    <div className="w-screen min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="py-6 text-center bg-gray-800 shadow-md w-full">
        <h1 className="text-6xl font-bold">
          <span className="text-white">gobbl</span>
          <span className="text-green-400">HODL</span>
        </h1>
        <p className="text-gray-400 text-lg">Powering the Food3 revolution with real-world perks</p>
      </header>

      {/* Main Section */}
      <main className="flex-grow grid grid-cols-2 gap-4 p-6">
        {/* Chatbot Section */}
        <div className="col-span-1 border-4 border-green-400 rounded-lg p-6 bg-gray-800">
          <div className="h-[70vh] overflow-y-auto mb-4 w-full">
            {messages.map((msg, index) => (
              <div key={index} className={`mb-4 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                <p className={`inline-block p-3 rounded-lg ${msg.sender === "user" ? "bg-blue-500" : "bg-gray-700"}`}>{msg.text}</p>

                {msg.suggestions && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {msg.suggestions.map((pizza) => (
                      <div key={pizza.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 flex flex-col items-center">
                        <img
                          src={pizza.image}
                          alt={pizza.name}
                          className="w-24 h-24 rounded-full mb-2"
                        />
                        <h4 className="text-lg font-bold mb-2">{pizza.name}</h4>
                        <p className="text-sm text-gray-400 mb-2">{pizza.description}</p>
                        <p className="text-sm text-green-400 font-bold mb-2">${pizza.price}</p>
                        <p className="text-sm text-yellow-400 mb-2">Calories: {pizza.calories}</p>
                        <p className="text-sm text-blue-400 mb-2">Rating: {pizza.rating}</p>
                        <button
                          onClick={() => handleOrder({ item: pizza.name, price: pizza.price })}
                          className="bg-green-500 text-black py-1 px-4 rounded-lg hover:bg-green-400"
                        >
                          Order Now
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center w-full">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-grow p-2 rounded-lg bg-gray-700 text-white mr-2"
              placeholder="Type your message here..."
            />
            <button
              onClick={sendMessage}
              className="bg-green-500 text-black py-2 px-4 rounded-lg hover:bg-green-400"
            >
              Send
            </button>
          </div>
        </div>

        {/* Delivery Details Section */}
        <div className="col-span-1 grid grid-rows-[1fr,auto] gap-4">
          <div className="grid grid-cols-2 grid-rows-2 gap-4">
            {Object.entries({
              Consumer: MapPin,
              Delivery: Navigation,
              Restaurant: Store,
              Accounting: DollarSign
            }).map(([title, Icon]) => (
              <div key={title} className="bg-gray-800 rounded-lg p-4 border border-blue-400">
                <div className="flex items-center mb-2">
                  <Icon className="mr-2 w-6 h-6" />
                  <h3 className="font-bold text-lg text-blue-400">{title}</h3>
                </div>
                <div className="h-32 overflow-y-auto bg-gray-700 rounded p-2">
                  {state.messages[title.toLowerCase()].map((msg, i) => (
                    <div key={i} className="mb-1">
                      <span className="text-gray-400 text-xs block">{msg.timestamp}</span>
                      <p className="text-gray-200 text-sm">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-green-400">
            <h3 className="font-bold text-lg text-green-400 mb-4">Payment Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-gray-400">Revenue</span>
                <p className="font-bold text-green-400 text-lg">${state.payments.totalRevenue.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Pending</span>
                <p className="font-bold text-yellow-400 text-lg">${state.payments.pendingPayments.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Completed</span>
                <p className="font-bold text-blue-400 text-lg">${state.payments.completedPayments.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Map and Reviews Section */}
    <section className="w-full grid grid-cols-2 gap-4 p-6">
      {/* Map Section */}
      <div className="bg-gray-900 p-6 rounded-lg shadow-2xl">
        <EnhancedDeliveryMap
          activeDelivery={activeDelivery}
          prepTime={PREP_TIME}
          deliveryTime={DELIVERY_TIME}
        />
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-gray-800 rounded-lg p-4 border border-green-400">
        <h3 className="font-bold text-lg text-green-400 mb-4">Customer Reviews</h3>
        <div className="space-y-2">
          {state.reviews.length > 0 ? (
            state.reviews.map((review, index) => (
              <div key={index} className="bg-gray-700 p-2 rounded">
                <p className="text-yellow-400">Rating: {review.rating} / 5</p>
                <p className="text-gray-200">{review.review}</p>
                <p className="text-gray-400 text-sm">- {review.item}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No reviews yet. Be the first to share your feedback!</p>
          )}
        </div>
      </div>
    </section>
  </div>
);

};

export default GobblDeliverySystem;
