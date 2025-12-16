/**
 * Conversation State Machine for Chatbot
 * 
 * Deterministic state tracking to prevent:
 * - Context loss
 * - Question repetition
 * - Robotic tone
 */

// Question definitions with humanized templates for each service
const SERVICE_QUESTIONS = {
    // Default questions for all services
    default: [
        {
            key: "name",
            patterns: ["name", "call you", "who are you"],
            templates: [
                "Hey there! 👋 Before we dive in, what should I call you?",
                "Hi! I'm excited to help. What's your name?",
            ],
            suggestions: null,
        },
        {
            key: "company",
            patterns: ["company", "project name", "business", "brand"],
            templates: [
                "Nice to meet you, {name}! 🎉 What's your company or project called?",
                "Great to have you here, {name}! What's the name of your project?",
            ],
            suggestions: null,
        },
        {
            key: "description",
            patterns: ["building", "describe", "tell me about", "project", "idea"],
            templates: [
                "Awesome! Tell me a bit about what you're building — I'm curious! 🚀",
                "Sounds exciting! What exactly are you looking to create?",
            ],
            suggestions: null,
        },
        {
            key: "budget",
            patterns: ["budget", "spend", "cost", "price", "inr", "₹"],
            templates: [
                "And what kind of budget are we working with? (Just a rough range in INR is fine!) 💰",
                "What budget do you have in mind for this? Even a ballpark helps!",
            ],
            suggestions: ["Under ₹25,000", "₹25,000 - ₹50,000", "₹50,000 - ₹1,00,000", "₹1,00,000+", "Flexible"],
        },
        {
            key: "timeline",
            patterns: ["timeline", "deadline", "when", "launch", "delivery", "complete"],
            templates: [
                "When are you hoping to have this ready? No pressure if you're flexible! ⏰",
                "What's your ideal timeline for this project?",
            ],
            suggestions: ["1-2 weeks", "1 month", "2-3 months", "Flexible"],
        },
    ],

    // Video Services specific questions
    "Video Services": [
        {
            key: "name",
            patterns: ["name", "call you"],
            templates: [
                "Hey! 🎬 Ready to create something amazing? What's your name?",
                "Hi there! Let's make some great video content. What should I call you?",
            ],
            suggestions: null,
        },
        {
            key: "video_type",
            patterns: ["type", "kind", "what video"],
            templates: [
                "Nice to meet you, {name}! What type of video are you looking for?",
            ],
            suggestions: ["Promotional", "Social Media", "YouTube/Vlog", "Corporate", "Explainer/Animated", "Other"],
        },
        {
            key: "goal",
            patterns: ["goal", "purpose", "objective", "why"],
            templates: [
                "Great choice! What's the main goal of this video? 🎯",
            ],
            suggestions: ["Brand Awareness", "Lead Generation", "Engagement", "Product Launch"],
        },
        {
            key: "footage",
            patterns: ["footage", "raw", "production", "shoot"],
            templates: [
                "Do you already have footage, or do you need full production? 📹",
            ],
            suggestions: ["I have footage", "Need full production", "Not sure yet"],
        },
        {
            key: "duration",
            patterns: ["duration", "length", "how long", "seconds", "minutes"],
            templates: [
                "How long should the final video be?",
            ],
            suggestions: ["Under 30 seconds", "30-60 seconds", "1-3 minutes", "3+ minutes"],
        },
        {
            key: "style",
            patterns: ["style", "mood", "tone", "vibe", "feel"],
            templates: [
                "What style or mood are you going for? 🎨",
            ],
            suggestions: ["Professional", "Fun/Energetic", "Emotional", "Cinematic", "Educational"],
        },
        {
            key: "platforms",
            patterns: ["platform", "where", "publish", "channel", "social"],
            templates: [
                "Where will this video be shared?",
            ],
            suggestions: ["Website", "YouTube", "Instagram", "LinkedIn", "TikTok", "Multiple"],
        },
        {
            key: "budget",
            patterns: ["budget", "cost", "price", "spend"],
            templates: [
                "What's your budget for this project? 💰",
            ],
            suggestions: ["Under ₹25,000", "₹25,000 - ₹60,000", "₹60,000 - ₹1,25,000", "₹1,25,000+"],
        },
        {
            key: "timeline",
            patterns: ["timeline", "deadline", "when", "delivery"],
            templates: [
                "When do you need the final video? ⏰",
            ],
            suggestions: ["Within 1 week", "2-4 weeks", "1-2 months", "Flexible"],
        },
        {
            key: "notes",
            patterns: ["notes", "else", "anything", "special", "reference"],
            templates: [
                "Any special requests or reference videos you'd like to share? (Optional - just type 'done' to skip)",
            ],
            suggestions: ["Skip this"],
        },
    ],

    // Website Development specific questions
    "Website Development": [
        {
            key: "name",
            patterns: ["name", "call you"],
            templates: [
                "Hey! 🚀 Let's build something amazing. What's your name?",
                "Hi there! Ready to create your website? What should I call you?",
            ],
            suggestions: null,
        },
        {
            key: "company",
            patterns: ["company", "project", "business"],
            templates: [
                "Nice to meet you, {name}! What's your company or project called?",
            ],
            suggestions: null,
        },
        {
            key: "description",
            patterns: ["building", "describe", "tell me", "about", "idea"],
            templates: [
                "Awesome! Tell me a bit about what you're building — what's the vision? 🚀",
                "Sounds exciting! What exactly are you looking to create?",
            ],
            suggestions: null,
        },
        {
            key: "website_type",
            patterns: ["type", "kind", "what website", "need"],
            templates: [
                "What kind of website do you need? (Select all that apply) 🌐",
            ],
            suggestions: ["Landing Page", "Business Website", "Informational Website", "E-commerce", "Portfolio", "Web App", "Other"],
            multiSelect: true,
        },
        {
            key: "pages",
            patterns: ["pages", "sections", "features"],
            templates: [
                "Every website includes: Home, About, Contact, Privacy Policy & Terms. What additional pages do you need? (Select all that apply)",
            ],
            suggestions: ["Services", "Products", "Portfolio/Gallery", "Testimonials", "Blog", "FAQ", "Pricing", "Shop/Store", "Cart/Checkout", "Wishlist", "Order Tracking", "Reviews/Ratings", "Search", "Book Now", "Account/Login", "Admin Dashboard", "User Dashboard", "Analytics Dashboard", "Notifications", "Chat/Support Widget", "Help/Support", "Resources", "Events", "None"],
            multiSelect: true,
        },
        {
            key: "integrations",
            patterns: ["integration", "payment", "api", "third-party"],
            templates: [
                "What integrations do you need? (Select all that apply) 🔌",
            ],
            suggestions: ["Payment Gateway (Razorpay/Stripe)", "Email Service (Nodemailer/Resend)", "Delivery/Shipping Tracking", "None"],
            multiSelect: true,
        },
        {
            key: "design",
            patterns: ["design", "look", "style", "wireframe"],
            templates: [
                "Do you have any designs or inspirations in mind? 🎨",
            ],
            suggestions: ["I have designs", "Need design help", "Have some references", "Not sure yet"],
        },
        {
            key: "tech",
            patterns: ["tech", "platform", "wordpress", "react"],
            templates: [
                "What technology stack would you prefer? (Select all that apply) 🛠️",
            ],
            suggestions: ["WordPress", "Next.js", "React.js", "React.js + Node.js", "MERN Stack", "PERN Stack", "Shopify", "Shopify + Hydrogen (React)", "Laravel + Vue", "Django + React", "Frontend Only", "Backend Only", "No preference"],
            multiSelect: true,
        },
        {
            key: "deployment",
            patterns: ["deploy", "hosting", "server", "cloud"],
            templates: [
                "Where would you like the website deployed/hosted? 🚀",
            ],
            suggestions: ["Vercel", "Netlify", "AWS", "DigitalOcean", "Railway", "Render", "VPS/Custom Server", "Not sure yet"],
            multiSelect: true,
        },
        {
            key: "domain",
            patterns: ["domain", "url", "website name"],
            templates: [
                "Do you have a domain name? 🌍",
            ],
            suggestions: ["I already have domain", "I don't have domain"],
        },
        {
            key: "budget",
            patterns: ["budget", "cost", "price", "spend"],
            templates: [
                "What's your budget for this project? 💰",
            ],
            suggestions: ["Under ₹20,000", "₹20,000 - ₹50,000", "₹50,000 - ₹1,00,000", "₹1,00,000+"],
        },
        {
            key: "timeline",
            patterns: ["timeline", "deadline", "when", "launch"],
            templates: [
                "When do you need the website ready? ⏰",
            ],
            suggestions: ["1-2 weeks", "1 month", "2-3 months", "Flexible"],
        },
    ],

    // Lead Generation specific questions
    "Lead Generation": [
        {
            key: "name",
            patterns: ["name", "call you"],
            templates: [
                "Hey! 📈 Ready to grow your leads? What's your name?",
                "Hi! Let's get you more customers. What should I call you?",
            ],
            suggestions: null,
        },
        {
            key: "business",
            patterns: ["business", "company", "do", "sell"],
            templates: [
                "Great, {name}! Tell me about your business - what do you offer?",
            ],
            suggestions: null,
        },
        {
            key: "target",
            patterns: ["target", "audience", "customer", "who"],
            templates: [
                "Who's your ideal customer? 🎯",
            ],
            suggestions: null,
        },
        {
            key: "volume",
            patterns: ["volume", "many", "leads", "number"],
            templates: [
                "How many leads per month are you looking for?",
            ],
            suggestions: ["Under 100", "100-500", "500-1000", "1000+"],
        },
        {
            key: "channels",
            patterns: ["channel", "method", "how", "source"],
            templates: [
                "Which channels work best for reaching your audience?",
            ],
            suggestions: ["Email", "LinkedIn", "Cold Calling", "Ads", "Mix of all"],
        },
        {
            key: "budget",
            patterns: ["budget", "cost", "spend"],
            templates: [
                "What's your budget for lead generation? 💰",
            ],
            suggestions: ["Under ₹25,000", "₹25,000 - ₹50,000", "₹50,000 - ₹1,00,000", "₹1,00,000+"],
        },
        {
            key: "timeline",
            patterns: ["timeline", "when", "start"],
            templates: [
                "When do you want to start the campaign? ⏰",
            ],
            suggestions: ["Immediately", "This week", "Next month", "Flexible"],
        },
    ],

    // Digital Marketing / SEO / Social Media
    "SEO Optimization": [
        {
            key: "name",
            patterns: ["name", "call you"],
            templates: [
                "Hey! 🔍 Ready to rank higher on Google? What's your name?",
            ],
            suggestions: null,
        },
        {
            key: "website",
            patterns: ["website", "url", "site"],
            templates: [
                "Nice to meet you, {name}! What's your website URL?",
            ],
            suggestions: null,
        },
        {
            key: "goals",
            patterns: ["goal", "achieve", "want", "need"],
            templates: [
                "What's your main goal with SEO? 🎯",
            ],
            suggestions: ["Rank higher", "More traffic", "More leads", "Brand visibility"],
        },
        {
            key: "keywords",
            patterns: ["keyword", "search", "term", "rank for"],
            templates: [
                "Any specific keywords you want to rank for?",
            ],
            suggestions: null,
        },
        {
            key: "competitors",
            patterns: ["competitor", "competition", "similar"],
            templates: [
                "Who are your main competitors?",
            ],
            suggestions: null,
        },
        {
            key: "budget",
            patterns: ["budget", "cost", "spend"],
            templates: [
                "What's your monthly budget for SEO? 💰",
            ],
            suggestions: ["Under ₹10,000/mo", "₹10,000 - ₹25,000/mo", "₹25,000 - ₹50,000/mo", "₹50,000+/mo"],
        },
        {
            key: "timeline",
            patterns: ["timeline", "when", "start"],
            templates: [
                "When would you like to start? ⏰",
            ],
            suggestions: ["Immediately", "This week", "Next month", "Flexible"],
        },
    ],

    "Social Media Management": [
        {
            key: "name",
            patterns: ["name", "call you"],
            templates: [
                "Hey! 📱 Let's grow your social presence! What's your name?",
            ],
            suggestions: null,
        },
        {
            key: "brand",
            patterns: ["brand", "business", "company"],
            templates: [
                "Nice, {name}! What's your brand or business called?",
            ],
            suggestions: null,
        },
        {
            key: "platforms",
            patterns: ["platform", "social", "channel"],
            templates: [
                "Which platforms do you want to focus on? 📲",
            ],
            suggestions: ["Instagram", "Facebook", "LinkedIn", "Twitter/X", "TikTok", "All of them"],
        },
        {
            key: "goals",
            patterns: ["goal", "achieve", "want"],
            templates: [
                "What's your main goal with social media?",
            ],
            suggestions: ["More followers", "Engagement", "Brand awareness", "Sales/Leads"],
        },
        {
            key: "content",
            patterns: ["content", "posts", "create"],
            templates: [
                "Do you need help with content creation too?",
            ],
            suggestions: ["Yes, full content", "Just scheduling", "Strategy only", "All of it"],
        },
        {
            key: "budget",
            patterns: ["budget", "cost", "spend"],
            templates: [
                "What's your monthly budget? 💰",
            ],
            suggestions: ["Under ₹15,000/mo", "₹15,000 - ₹30,000/mo", "₹30,000 - ₹50,000/mo", "₹50,000+/mo"],
        },
        {
            key: "timeline",
            patterns: ["timeline", "when", "start"],
            templates: [
                "When do you want to kick this off? ⏰",
            ],
            suggestions: ["Immediately", "This week", "Next month", "Flexible"],
        },
    ],

    "Performance Marketing": [
        {
            key: "name",
            patterns: ["name", "call you"],
            templates: [
                "Hey! 🎯 Ready to run some high-converting ads? What's your name?",
            ],
            suggestions: null,
        },
        {
            key: "business",
            patterns: ["business", "company", "sell", "offer"],
            templates: [
                "Great, {name}! What does your business sell or offer?",
            ],
            suggestions: null,
        },
        {
            key: "platforms",
            patterns: ["platform", "where", "ads"],
            templates: [
                "Where do you want to run ads? 📊",
            ],
            suggestions: ["Google Ads", "Meta (FB/IG)", "LinkedIn", "YouTube", "Multiple"],
        },
        {
            key: "goals",
            patterns: ["goal", "achieve", "want", "objective"],
            templates: [
                "What's your main advertising goal?",
            ],
            suggestions: ["More sales", "Lead generation", "Website traffic", "Brand awareness"],
        },
        {
            key: "budget",
            patterns: ["budget", "cost", "spend", "ad spend"],
            templates: [
                "What's your monthly ad budget? 💰",
            ],
            suggestions: ["Under ₹25,000/mo", "₹25,000 - ₹50,000/mo", "₹50,000 - ₹1,00,000/mo", "₹1,00,000+/mo"],
        },
        {
            key: "timeline",
            patterns: ["timeline", "when", "start", "launch"],
            templates: [
                "When do you want to launch your campaigns? ⏰",
            ],
            suggestions: ["Immediately", "This week", "Next month", "Flexible"],
        },
    ],

    // Creative & Design specific questions
    "Creative & Design": [
        {
            key: "name",
            patterns: ["name", "call you"],
            templates: [
                "Hey! 🎨 Let's create something beautiful. What's your name?",
            ],
            suggestions: null,
        },
        {
            key: "company",
            patterns: ["company", "brand", "business"],
            templates: [
                "Nice to meet you, {name}! What's your company or brand called?",
            ],
            suggestions: null,
        },
        {
            key: "design_type",
            patterns: ["type", "need", "looking for", "want"],
            templates: [
                "What kind of design work do you need? ✨",
            ],
            suggestions: ["Logo", "Branding", "Social Media Graphics", "UI/UX", "Print Design", "Other"],
        },
        {
            key: "style",
            patterns: ["style", "look", "vibe", "aesthetic"],
            templates: [
                "What style or vibe are you going for?",
            ],
            suggestions: ["Modern/Minimal", "Bold/Colorful", "Elegant/Luxury", "Playful/Fun", "Not sure yet"],
        },
        {
            key: "deliverables",
            patterns: ["deliver", "files", "formats", "need"],
            templates: [
                "What deliverables do you need?",
            ],
            suggestions: ["Logo files", "Social templates", "Brand guidelines", "Print-ready files", "All of it"],
        },
        {
            key: "budget",
            patterns: ["budget", "cost", "spend"],
            templates: [
                "What's your budget for this project? 💰",
            ],
            suggestions: ["Under ₹10,000", "₹10,000 - ₹25,000", "₹25,000 - ₹50,000", "₹50,000+"],
        },
        {
            key: "timeline",
            patterns: ["timeline", "when", "deadline"],
            templates: [
                "When do you need this done? ⏰",
            ],
            suggestions: ["This week", "1-2 weeks", "1 month", "Flexible"],
        },
    ],

    // Writing & Content specific questions
    "Writing & Content": [
        {
            key: "name",
            patterns: ["name", "call you"],
            templates: [
                "Hey! ✍️ Ready to create amazing content? What's your name?",
            ],
            suggestions: null,
        },
        {
            key: "company",
            patterns: ["company", "brand", "business"],
            templates: [
                "Nice, {name}! What's your company or brand called?",
            ],
            suggestions: null,
        },
        {
            key: "content_type",
            patterns: ["type", "kind", "need", "content"],
            templates: [
                "What type of content do you need? 📝",
            ],
            suggestions: ["Blog posts", "Website copy", "Social media", "Email campaigns", "Scripts", "Other"],
        },
        {
            key: "tone",
            patterns: ["tone", "style", "voice", "sound"],
            templates: [
                "What tone should the content have?",
            ],
            suggestions: ["Professional", "Friendly", "Persuasive", "Educational", "Fun/Casual"],
        },
        {
            key: "volume",
            patterns: ["volume", "how much", "many", "pieces"],
            templates: [
                "How much content do you need?",
            ],
            suggestions: ["1-5 pieces", "5-10 pieces", "10-20 pieces", "Ongoing monthly"],
        },
        {
            key: "budget",
            patterns: ["budget", "cost", "spend"],
            templates: [
                "What's your budget for this? 💰",
            ],
            suggestions: ["Under ₹5,000", "₹5,000 - ₹15,000", "₹15,000 - ₹30,000", "₹30,000+"],
        },
        {
            key: "timeline",
            patterns: ["timeline", "when", "deadline"],
            templates: [
                "When do you need the content? ⏰",
            ],
            suggestions: ["ASAP", "This week", "2 weeks", "Flexible"],
        },
    ],

    // Customer Support specific questions
    "Customer Support": [
        {
            key: "name",
            patterns: ["name", "call you"],
            templates: [
                "Hey! 🎧 Let's set up amazing support for your customers. What's your name?",
            ],
            suggestions: null,
        },
        {
            key: "company",
            patterns: ["company", "business", "brand"],
            templates: [
                "Nice to meet you, {name}! What's your company called?",
            ],
            suggestions: null,
        },
        {
            key: "support_type",
            patterns: ["type", "kind", "need", "support"],
            templates: [
                "What type of support do you need? 💬",
            ],
            suggestions: ["Live chat", "Email support", "Phone support", "All channels", "Helpdesk setup"],
        },
        {
            key: "volume",
            patterns: ["volume", "tickets", "requests", "many"],
            templates: [
                "How many support tickets do you handle per day?",
            ],
            suggestions: ["Under 50", "50-200", "200-500", "500+"],
        },
        {
            key: "hours",
            patterns: ["hours", "availability", "24/7", "time"],
            templates: [
                "What hours of coverage do you need?",
            ],
            suggestions: ["Business hours", "Extended hours", "24/7", "Flexible"],
        },
        {
            key: "budget",
            patterns: ["budget", "cost", "spend"],
            templates: [
                "What's your monthly budget for support? 💰",
            ],
            suggestions: ["Under ₹30,000/mo", "₹30,000 - ₹60,000/mo", "₹60,000 - ₹1,00,000/mo", "₹1,00,000+/mo"],
        },
        {
            key: "timeline",
            patterns: ["timeline", "when", "start"],
            templates: [
                "When do you want to start? ⏰",
            ],
            suggestions: ["Immediately", "This week", "Next month", "Flexible"],
        },
    ],

    // Audio Services specific questions
    "Audio Services": [
        {
            key: "name",
            patterns: ["name", "call you"],
            templates: [
                "Hey! 🎙️ Let's create some amazing audio. What's your name?",
            ],
            suggestions: null,
        },
        {
            key: "audio_type",
            patterns: ["type", "kind", "need", "audio"],
            templates: [
                "Nice, {name}! What type of audio work do you need?",
            ],
            suggestions: ["Voiceover", "Podcast editing", "Music/Jingle", "Sound design", "Mixing/Mastering", "Other"],
        },
        {
            key: "purpose",
            patterns: ["purpose", "for", "use", "goal"],
            templates: [
                "What's this audio for? 🎵",
            ],
            suggestions: ["Commercial/Ad", "Podcast", "YouTube", "Corporate", "Music release", "Other"],
        },
        {
            key: "duration",
            patterns: ["duration", "long", "length", "minutes"],
            templates: [
                "How long will the final audio be?",
            ],
            suggestions: ["Under 1 minute", "1-5 minutes", "5-30 minutes", "30+ minutes"],
        },
        {
            key: "voice",
            patterns: ["voice", "talent", "speaker"],
            templates: [
                "Do you need voice talent?",
            ],
            suggestions: ["Male voice", "Female voice", "I'll provide recordings", "Not needed"],
        },
        {
            key: "budget",
            patterns: ["budget", "cost", "spend"],
            templates: [
                "What's your budget for this project? 💰",
            ],
            suggestions: ["Under ₹10,000", "₹10,000 - ₹25,000", "₹25,000 - ₹50,000", "₹50,000+"],
        },
        {
            key: "timeline",
            patterns: ["timeline", "when", "deadline"],
            templates: [
                "When do you need the final audio? ⏰",
            ],
            suggestions: ["This week", "1-2 weeks", "1 month", "Flexible"],
        },
    ],

    // Add aliases for services that might have different names
    "App Development": null, // Will use Website Development
    "Software Development": null, // Will use Website Development

};

/**
 * Build conversation state from message history
 * @param {Array} history - Array of {role, content} messages
 * @param {string} service - Service name
 * @returns {Object} State with collectedData and currentStep
 */
export function buildConversationState(history, service) {
    // Handle aliases (null values map to other services)
    let questions = SERVICE_QUESTIONS[service];
    if (questions === null) {
        // Alias - use Website Development for App/Software Development
        questions = SERVICE_QUESTIONS["Website Development"] || SERVICE_QUESTIONS.default;
    } else if (!questions) {
        questions = SERVICE_QUESTIONS.default;
    }

    const collectedData = {};

    // Simple approach: count assistant-user pairs to determine step
    // Each valid pair = one question answered
    let answeredCount = 0;

    // Patterns that indicate an assistant message is asking a question (not just chatting)
    const isQuestionMessage = (msg) => {
        const content = (msg || "").toLowerCase();

        // Exclude generic greetings even if they have "?"
        if (content.includes("how can i help") || content.includes("what can i help")) {
            return false;
        }

        // Must contain actual question indicators from our question templates
        return content.includes("what's your") ||
            content.includes("what is your") ||
            content.includes("what should i call") ||
            content.includes("company or project") ||
            content.includes("what exactly are you") ||
            content.includes("what's the vision") ||
            content.includes("do you have") ||
            content.includes("select all") ||
            content.includes("what kind") ||
            content.includes("what technology") ||
            content.includes("tell me") ||
            content.includes("where would") ||
            content.includes("when do you") ||
            content.includes("what integrations") ||
            content.includes("what additional") ||
            content.includes("designs or inspirations") ||
            content.includes("deployed/hosted") ||
            content.includes("domain name") ||
            content.includes("budget") ||
            content.includes("timeline") ||
            content.includes("website ready");
    };

    for (let i = 0; i < history.length - 1; i++) {
        const botMsg = history[i];
        const userMsg = history[i + 1];

        if (botMsg.role === "assistant" && userMsg?.role === "user") {
            const botContent = botMsg.content || "";
            const userAnswer = userMsg.content?.trim();

            // Skip if bot message was not a question (e.g., "How can I help you?")
            // Only count if it's an actual question from the flow
            if (!isQuestionMessage(botContent)) {
                continue;
            }

            // Skip greetings - don't count as answer to name question
            const isGreeting = /^(hi|hello|hey|hii|hiii|yo|sup|what's up|whats up)$/i.test(userAnswer);

            if (userAnswer && !isGreeting) {
                // Map answer to the question at this step
                const questionAtStep = questions[answeredCount];
                if (questionAtStep) {
                    collectedData[questionAtStep.key] = userAnswer;
                }
                answeredCount++;
            }
        }
    }

    // Current step is the next unanswered question
    const currentStep = answeredCount;

    return {
        collectedData,
        currentStep,
        questions,
        service,
        isComplete: currentStep >= questions.length,
    };
}

/**
 * Process the user's current message and update state
 * @param {Object} state - Current conversation state
 * @param {string} message - User's message
 * @returns {Object} Updated state
 */
export function processUserAnswer(state, message) {
    const { collectedData, currentStep, questions } = state;
    const currentQuestion = questions[currentStep];

    console.log(`📝 processUserAnswer: currentStep=${currentStep}, currentQuestion=${currentQuestion?.key}, message="${message}"`);

    // Detect greetings - don't save as answer, just re-ask the question
    const isGreeting = /^(hi|hello|hey|hii|hiii|yo|sup|what's up|whats up)$/i.test(message.trim());

    if (isGreeting) {
        // Don't advance step for greetings
        return {
            ...state,
            collectedData,
            currentStep,  // Keep same step
            isComplete: false,
        };
    }

    // Direct timeline detection - if message looks like a timeline answer, store it
    const isTimelineAnswer = /^\s*(?:\d+[-\s]?\d*\s*)?(?:week|month|day)s?\s*$/i.test(message.trim()) ||
        /^flexible$/i.test(message.trim()) ||
        /^1-2 weeks$/i.test(message.trim()) ||
        /^1 month$/i.test(message.trim()) ||
        /^2-3 months$/i.test(message.trim());

    if (isTimelineAnswer && !collectedData.timeline) {
        console.log(`⏰ Direct timeline detection: storing "${message}" as timeline`);
        collectedData.timeline = message.trim();
    }

    if (currentQuestion && message.trim()) {
        // Handle skip
        if (message.toLowerCase().includes("skip") || message.toLowerCase() === "done") {
            collectedData[currentQuestion.key] = "[skipped]";
        } else {
            collectedData[currentQuestion.key] = message.trim();
        }
        console.log(`✅ Stored: ${currentQuestion.key} = "${message.trim()}"`);
    } else {
        console.log(`⚠️ currentQuestion is undefined or message empty`);
    }

    const newStep = currentStep + 1;
    const isComplete = newStep >= questions.length;

    console.log(`📊 After process: newStep=${newStep}, questionsLength=${questions.length}, isComplete=${isComplete}`);

    return {
        ...state,
        collectedData,
        currentStep: newStep,
        isComplete: isComplete,
    };
}

/**
 * Get the next humanized question
 * @param {Object} state - Current conversation state
 * @returns {string} Next question with suggestions formatted
 */
export function getNextHumanizedQuestion(state) {
    const { collectedData, currentStep, questions } = state;

    if (currentStep >= questions.length) {
        return null; // Ready for proposal
    }

    const question = questions[currentStep];
    const templates = question.templates;

    // Pick random template for variety
    let text = templates[Math.floor(Math.random() * templates.length)];

    // Replace placeholders like {name} with actual values
    for (const [key, value] of Object.entries(collectedData)) {
        text = text.replace(new RegExp(`\\{${key}\\}`, "gi"), value);
    }

    // Add suggestions if available
    if (question.suggestions) {
        const tag = question.multiSelect ? "MULTI_SELECT" : "SUGGESTIONS";
        text += `\n[${tag}: ${question.suggestions.join(" | ")}]`;
    }

    return text;
}

/**
 * Check if we have enough info to generate proposal
 * @param {Object} state - Current conversation state
 * @returns {boolean}
 */
export function shouldGenerateProposal(state) {
    const { collectedData, isComplete, currentStep, questions } = state;

    console.log(`🔍 shouldGenerateProposal: isComplete=${isComplete}, currentStep=${currentStep}, questionsLength=${questions?.length}, collectedKeys=${Object.keys(collectedData).join(",")}`);

    // Primary check: all questions answered
    if (isComplete) {
        console.log("✅ Proposal: isComplete is true");
        return true;
    }

    // Secondary check: currentStep has passed the last question
    if (currentStep >= questions.length) {
        console.log("✅ Proposal: currentStep >= questions.length");
        return true;
    }

    // Direct check: if timeline is answered, we're done (Website Development has 12 questions, timeline is last)
    if (collectedData.timeline && collectedData.timeline !== "[skipped]") {
        console.log("✅ Proposal: timeline is answered");
        return true;
    }

    console.log(`❌ Proposal: Not ready - currentStep=${currentStep}, questionsLength=${questions?.length}`);
    return false;
}

/**
 * Generate proposal from collected state
 * @param {Object} state - Completed conversation state
 * @returns {string} Proposal in [PROPOSAL_DATA] format
 */
export function generateProposalFromState(state) {
    const { collectedData, service } = state;

    // Helper: detect if value looks like a budget (must have ₹ or currency indicators)
    const isBudget = (val) => /₹[\d,]+|₹\s*[\d,]+|under\s*₹|[\d,]+\s*(?:lakh|k\b)|inr\s*[\d,]+/i.test(val);

    // Helper: detect if value looks like a timeline
    const isTimeline = (val) => /^\s*(?:\d+[-\s]?\d*\s*)?(?:week|month|day)s?\s*$/i.test(val) || /^flexible$/i.test(val);

    // Helper: detect if value looks like tech stack
    const isTechStack = (val) => /\b(?:react(?:\.?js)?|next(?:\.?js)?|node(?:\.?js)?|wordpress|shopify|laravel|django|mern|pern|vue|frontend\s+only|backend\s+only)\b/i.test(val);

    // Helper: detect if value looks like deployment platform
    const isDeployment = (val) => /vercel|netlify|aws|digitalocean|railway|render|vps|server|heroku/i.test(val);

    // Helper: detect if value looks like domain answer
    const isDomain = (val) => /(?:have|need|don't).*domain|already have domain|i don't have/i.test(val);

    // Helper: detect if value looks like design answer
    const isDesign = (val) => /have design|need design|wireframe|figma|reference|not sure yet/i.test(val);

    // Helper: detect if value looks like website type
    const isWebsiteType = (val) => /landing\s*page|business\s*website|informational|e-commerce|portfolio|web\s*app|saas/i.test(val);

    // Helper: detect if value looks like pages
    const isPages = (val) => /services|products|gallery|testimonials|blog|faq|pricing|shop|store|cart|checkout|wishlist|order|reviews|ratings|search|book\s*now|account|login|dashboard|analytics|support|resources|events|notifications|chat|widget/i.test(val);

    // Helper: detect if value looks like integrations
    const isIntegration = (val) => /payment|razorpay|stripe|paypal|email|sendgrid|mailchimp|delivery|shipping|sms|analytics|social login|google|facebook|crm|marketing|cloud storage|video|chatbot|ai assistant/i.test(val);

    // Smart extraction - analyze ALL collected values and categorize them properly
    let clientName = "";
    let projectName = "";
    let projectDescription = "";
    let websiteType = "";
    let pages = "";
    let designStatus = "";
    let techStack = "";
    let deploymentPlatform = "";
    let domainStatus = "";
    let integrations = "";
    let budget = "";
    let timeline = "";

    // First pass: Get the obvious ones by key
    clientName = collectedData.name || "";

    // Second pass: Analyze each value by content
    for (const [key, value] of Object.entries(collectedData)) {
        if (!value || value === "[skipped]") continue;
        const val = value.toString().trim();

        // Skip if already assigned as name
        if (key === "name") continue;

        // Check patterns in order of specificity
        if (isBudget(val) && !budget) {
            budget = val;
        }
        else if (isTimeline(val) && !timeline) {
            timeline = val;
        }
        else if (isTechStack(val) && !techStack) {
            techStack = val;
        }
        else if (isDeployment(val) && !deploymentPlatform) {
            deploymentPlatform = val;
        }
        else if (isDomain(val) && !domainStatus) {
            domainStatus = val;
        }
        else if (isDesign(val) && !designStatus) {
            designStatus = val;
        }
        else if (isWebsiteType(val) && !websiteType) {
            websiteType = val;
        }
        else if (isPages(val) && !pages) {
            pages = val;
        }
        else if (isIntegration(val) && !integrations) {
            integrations = val;
        }
        // Long descriptive text - likely project description
        else if (val.length > 20 && !projectDescription && !isBudget(val) && !isTimeline(val)) {
            projectDescription = val;
        }
        // Short company/project name
        else if (key === "company" && val.length <= 20 && !projectName) {
            projectName = val;
        }
    }

    // Extract project name from description if it contains "called X" or "named X"
    if (projectDescription && !projectName) {
        const nameMatch = projectDescription.match(/(?:called|named|is)\s+([a-zA-Z0-9]+)/i);
        if (nameMatch) {
            projectName = nameMatch[1].trim();
            // Capitalize first letter
            projectName = projectName.charAt(0).toUpperCase() + projectName.slice(1);
        }
    }

    // Rewrite project description to be more professional
    let formattedDescription = projectDescription;
    if (projectDescription) {
        // Capitalize first letter and ensure proper ending
        formattedDescription = projectDescription.charAt(0).toUpperCase() + projectDescription.slice(1);
        if (!formattedDescription.endsWith('.')) {
            formattedDescription += '.';
        }
    }

    // Apply defaults for missing values
    clientName = clientName || "Client";
    projectName = projectName || "Custom Project";
    formattedDescription = formattedDescription || "Custom web development project as per client requirements.";
    websiteType = websiteType || "Custom Website";
    designStatus = designStatus || "Design assistance required";
    techStack = techStack || "To be recommended based on requirements";
    deploymentPlatform = deploymentPlatform || "To be discussed";
    budget = budget || "To be discussed";
    timeline = timeline || "Flexible";

    // Format domain status professionally
    let formattedDomain = "To be discussed";
    if (domainStatus) {
        const domainLower = domainStatus.toLowerCase();
        if (domainLower.includes("already have") || (domainLower.includes("have") && !domainLower.includes("don't"))) {
            formattedDomain = "✓ Client owns domain";
        } else if (domainLower.includes("don't") || domainLower.includes("need")) {
            formattedDomain = "Domain purchase required";
        }
    }

    // Format design status professionally
    let formattedDesign = "Design assistance required";
    if (designStatus) {
        const designLower = designStatus.toLowerCase();
        if (designLower.includes("i have") || designLower.includes("have design")) {
            formattedDesign = "✓ Client will provide designs";
        } else if (designLower.includes("need") || designLower.includes("help")) {
            formattedDesign = "Design to be created";
        } else if (designLower.includes("reference")) {
            formattedDesign = "Design from references";
        } else if (designLower.includes("not sure")) {
            formattedDesign = "Design consultation needed";
        }
    }

    // Format pages with default pages included
    const defaultPages = ["Home", "About", "Contact", "Privacy Policy", "Terms of Service"];
    let additionalPages = [];
    if (pages && pages !== "Standard pages") {
        additionalPages = pages.split(",").map(p => p.trim()).filter(p => p);
    }

    const formattedPages = `  • Default: ${defaultPages.join(", ")}${additionalPages.length > 0 ? "\n  • Additional: " + additionalPages.join(", ") : ""}`;

    return `[PROPOSAL_DATA]
PROJECT PROPOSAL

═══════════════════════════════════════
CLIENT DETAILS
═══════════════════════════════════════
Client Name: ${clientName}
Project Name: ${projectName}
Service: ${service || "Website Development"}

═══════════════════════════════════════
PROJECT OVERVIEW
═══════════════════════════════════════
${formattedDescription}

Website Type: ${websiteType.replace(/,\s*/g, ", ")}

Pages & Features:
${formattedPages}

═══════════════════════════════════════
TECHNICAL SPECIFICATIONS
═══════════════════════════════════════
Technology Stack: ${techStack.replace(/,\s*/g, ", ")}
Deployment: ${deploymentPlatform.replace(/,\s*/g, ", ")}
Domain: ${formattedDomain}
Design: ${formattedDesign}
Integrations: ${integrations ? integrations.replace(/,\s*/g, ", ") : "None specified"}

═══════════════════════════════════════
INVESTMENT & TIMELINE
═══════════════════════════════════════
Budget: ${budget}
Timeline: ${timeline}

═══════════════════════════════════════
NEXT STEPS
═══════════════════════════════════════
1. Review and confirm this proposal
2. Sign agreement and pay deposit (50%)
3. Kickoff meeting to begin work

To customize this proposal, use the Edit Proposal option.
[/PROPOSAL_DATA]`;
}

/**
 * Get opening message for a service
 * @param {string} service - Service name
 * @returns {string} Opening greeting
 */
export function getOpeningMessage(service) {
    const openings = {
        "Video Services": "Hey! 🎬 I'm here to help you create an amazing video. Let's figure out exactly what you need!",
        "Website Development": "Hi there! 🚀 Ready to build something awesome? Let's talk about your website project!",
        "App Development": "Hey! 📱 Ready to build your app? Let's figure out exactly what you need!",
        "Software Development": "Hi! 💻 Let's build some amazing software together. Tell me about your project!",
        "Lead Generation": "Hello! 📈 Looking to grow your leads? I'll help you put together the perfect campaign!",
        "Creative & Design": "Hey! 🎨 Let's create something beautiful together. Tell me about your design needs!",
        "SEO Optimization": "Hi! 🔍 Ready to rank higher on Google? Let's boost your visibility!",
        "Social Media Management": "Hey! 📱 Let's grow your social presence! Tell me about your goals.",
        "Performance Marketing": "Hi! 🎯 Ready to run some high-converting ads? Let's get started!",
        "Writing & Content": "Hey! ✍️ Ready to create amazing content? Let's talk about what you need!",
        "Customer Support": "Hi! 🎧 Let's set up great customer support. Tell me about your needs!",
        "Audio Services": "Hey! 🎙️ Let's create some amazing audio together!",
        "default": "Hey there! 👋 I'm excited to help you with your project. Let's get started!"
    };

    return openings[service] || openings.default;
}

export const SERVICE_QUESTIONS_MAP = SERVICE_QUESTIONS;
