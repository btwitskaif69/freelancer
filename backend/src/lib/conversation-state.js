/**
 * Conversation State Machine for Chatbot
 * 
 * Deterministic state tracking to prevent:
 * - Context loss
 * - Question repetition
 * - Robotic tone
 */

import { CHATBOTS_BY_SERVICE, getChatbot } from "./chatbots/index.js";

export const SERVICE_QUESTIONS_MAP = Object.freeze(
    Object.fromEntries(
        Object.entries(CHATBOTS_BY_SERVICE).map(([service, chatbot]) => [
            service,
            chatbot.questions,
        ])
    )
);

const QUESTION_KEY_TAG_REGEX = /\[QUESTION_KEY:\s*([^\]]+)\]/i;

const normalizeText = (value = "") => (value || "").toString().trim();

const getQuestionKeyFromAssistant = (value = "") => {
    const match = normalizeText(value).match(QUESTION_KEY_TAG_REGEX);
    return match ? match[1].trim() : null;
};

const withQuestionKeyTag = (text = "", key = "") => {
    if (!key) return text;
    if (QUESTION_KEY_TAG_REGEX.test(text)) return text;
    return `${text}\n[QUESTION_KEY: ${key}]`;
};

const isGreetingMessage = (value = "") =>
    /^(hi|hello|hey|hii+|yo|sup|what'?s up|whats up)\b/i.test(normalizeText(value));

const isSkipMessage = (value = "") => {
    const text = normalizeText(value).toLowerCase();
    return text === "skip" || text === "done" || text === "na" || text === "n/a" || text.includes("skip");
};

const extractBudget = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return null;
    if (/^flexible$/i.test(text)) return "Flexible";

    let match = text.match(/(?:\u20B9|inr|rs\.?|rupees?)\s*([\d,]+(?:\.\d+)?)\b/i);
    if (match) return match[1].replace(/,/g, "");

    match = text.match(/\b(\d+(?:\.\d+)?)\s*(k)\b/i);
    if (match) return `${match[1]}k`;

    match = text.match(/\b(\d+(?:\.\d+)?)\s*(l)\b/i);
    if (match) return `${match[1]}L`;

    match = text.match(/\b(\d+(?:\.\d+)?)\s*lakh(s)?\b/i);
    if (match) return `${match[1]} lakh`;

    match = text.match(/\b(\d{4,})\b/);
    if (match && /(budget|cost|price|inr|\u20B9|rs|rupees?)/i.test(text)) return match[1];

    return null;
};

const extractTimeline = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return null;
    if (/^flexible$/i.test(text)) return "Flexible";

    let match = text.match(/\b(\d+\s*-\s*\d+)\s*(day|week|month|year)s?\b/i);
    if (match) {
        const range = match[1].replace(/\s*/g, "");
        const unit = match[2].toLowerCase();
        return `${range} ${unit}s`;
    }

    match = text.match(/\b(\d+)\s*(day|week|month|year)s?\b/i);
    if (match) {
        const count = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        return `${count} ${unit}${count === 1 ? "" : "s"}`;
    }

    if (/\b(asap|urgent|immediately)\b/i.test(text)) return text;
    if (/\bby\b/i.test(text)) return text;
    if (/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/i.test(text)) return text;

    return null;
};

const isBareBudgetAnswer = (value = "") => {
    const text = normalizeText(value)
        .replace(/\?/g, "")
        .toLowerCase();
    if (!text) return false;
    if (text === "flexible") return true;

    // Examples: "60000", "₹60,000", "INR 60000", "60k", "1 lakh", "Under ₹120,000"
    if (/^under\s+(?:\u20B9|inr|rs\.?|rupees?)?\s*\d[\d,]*(?:\.\d+)?\s*(?:k|l|lakh)?\s*$/i.test(text)) {
        return true;
    }

    return /^(?:(?:\u20B9|inr|rs\.?|rupees?)\s*)?\d[\d,]*(?:\.\d+)?\s*(?:k|l|lakh)?\s*$/.test(text);
};

const isBareTimelineAnswer = (value = "") => {
    const text = normalizeText(value)
        .replace(/\?/g, "")
        .toLowerCase();
    if (!text) return false;
    if (text === "flexible") return true;
    if (/^(asap|urgent|immediately|this week|next week|next month)$/i.test(text)) return true;
    if (/^\d+\s*-\s*\d+\s*(day|week|month|year)s?$/.test(text)) return true;
    return /^\d+\s*(day|week|month|year)s?$/.test(text);
};

const isUserQuestion = (value = "") => {
    const text = normalizeText(value);
    if (!text) return false;
    if (text.includes("?")) {
        const withoutMarks = text.replace(/\?/g, "");
        // Treat pure budget/timeline inputs as answers even if a user typed '?'. Otherwise it's a question.
        if (isBareBudgetAnswer(withoutMarks) || isBareTimelineAnswer(withoutMarks)) return false;
        return true;
    }
    return /^(can|could|would|should|do|does|is|are|will|may|what|why|how|when|where|which)\b/i.test(text);
};

const isLikelyName = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return false;
    if (text.length > 40) return false;
    if (/\bhttps?:\/\//i.test(text) || /\bwww\./i.test(text)) return false;
    if (text.includes("@")) return false;
    if (/\d{2,}/.test(text)) return false;
    if (/(budget|timeline|website|app|project|need|want|build|looking)\b/i.test(text)) return false;
    return /[a-zA-Z]/.test(text);
};

const extractName = (value = "") => {
    const text = normalizeText(value).replace(/\?/g, "");
    if (!text) return null;
    const match = text.match(/\bmy name is\s+(.+)$/i);
    if (match) return match[1].trim();
    return isLikelyName(text) ? text.trim() : null;
};

const getCurrentStepFromCollected = (questions = [], collectedData = {}) => {
    for (let i = 0; i < questions.length; i++) {
        const key = questions[i]?.key;
        if (!key) continue;
        const value = collectedData[key];
        if (value === undefined || value === null || normalizeText(value) === "") {
            return i;
        }
    }
    return questions.length;
};

const extractKnownFieldsFromMessage = (questions = [], message = "", collectedData = {}) => {
    const text = normalizeText(message);
    if (!text || isGreetingMessage(text)) return {};

    const keys = new Set(questions.map((q) => q.key));
    const updates = {};

    if (keys.has("budget")) {
        const budget = extractBudget(text);
        if (budget) updates.budget = budget;
    }

    if (keys.has("timeline")) {
        const timeline = extractTimeline(text);
        if (timeline) updates.timeline = timeline;
    }

    if (keys.has("name") && !collectedData.name) {
        const name = extractName(text);
        if (name) updates.name = name;
    }

    const descriptionKey =
        keys.has("description")
            ? "description"
            : keys.has("summary")
                ? "summary"
                : keys.has("vision")
                    ? "vision"
                    : null;

    if (descriptionKey && !collectedData[descriptionKey] && !isUserQuestion(text)) {
        const looksDescriptive =
            text.length >= 25 &&
            /(need|looking|build|create|develop|want|require|make)\b/i.test(text);
        if (looksDescriptive) {
            updates[descriptionKey] = text;
        }
    }

    return updates;
};

const extractAnswerForQuestion = (question, rawMessage) => {
    const message = normalizeText(rawMessage);
    if (!question || !message) return null;
    if (isGreetingMessage(message)) return null;
    if (isSkipMessage(message)) return "[skipped]";

    switch (question.key) {
        case "budget": {
            return extractBudget(message);
        }
        case "timeline": {
            return extractTimeline(message);
        }
        case "name": {
            return extractName(message);
        }
        default: {
            if (Array.isArray(question.suggestions) && question.suggestions.length) {
                const normalized = message
                    .toLowerCase()
                    .replace(/[?.!]+$/g, "")
                    .trim();
                const matched = question.suggestions.find((opt) => {
                    const candidate = normalizeText(opt)
                        .toLowerCase()
                        .replace(/[?.!]+$/g, "")
                        .trim();
                    return candidate === normalized;
                });
                if (matched) return matched;
            }

            if (isUserQuestion(message)) {
                const qIndex = message.indexOf("?");
                const beforeQuestion = qIndex >= 0 ? message.slice(0, qIndex).trim() : "";
                const cutAt = Math.max(
                    beforeQuestion.lastIndexOf("."),
                    beforeQuestion.lastIndexOf("!"),
                    beforeQuestion.lastIndexOf("\n")
                );
                const candidate = (cutAt > -1
                    ? beforeQuestion.slice(0, cutAt)
                    : beforeQuestion
                ).trim();

                if (!candidate) return null;
                if (isUserQuestion(candidate)) return null;
                if (isBareBudgetAnswer(candidate) || isBareTimelineAnswer(candidate)) return null;
                if (extractBudget(candidate) && candidate.length <= 30) return null;
                if (extractTimeline(candidate) && candidate.length <= 30) return null;

                return candidate;
            }
            return message;
        }
    }
};


/**
 * Build conversation state from message history
 * @param {Array} history - Array of {role, content} messages
 * @param {string} service - Service name
 * @returns {Object} State with collectedData and currentStep
 */
export function buildConversationState(history, service) {
    const { questions } = getChatbot(service);
    const safeHistory = Array.isArray(history) ? history : [];
    const collectedData = {};

    // Extract structured fields even if the user answered out-of-sequence.
    for (const msg of safeHistory) {
        if (msg?.role === "user") {
            Object.assign(
                collectedData,
                extractKnownFieldsFromMessage(questions, msg.content, collectedData)
            );
        }
    }

    // Map user replies to the exact question asked (tagged in assistant messages).
    for (let i = 0; i < safeHistory.length - 1; i++) {
        const botMsg = safeHistory[i];
        const userMsg = safeHistory[i + 1];
        if (botMsg?.role !== "assistant" || userMsg?.role !== "user") continue;

        const askedKey = getQuestionKeyFromAssistant(botMsg.content);
        if (!askedKey) continue;

        const question = questions.find((q) => q.key === askedKey);
        if (!question) continue;

        const answer = extractAnswerForQuestion(question, userMsg.content);
        if (answer !== null && answer !== undefined) {
            collectedData[question.key] = answer;
        }
    }

    const currentStep = getCurrentStepFromCollected(questions, collectedData);

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
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    const collectedData = { ...(state?.collectedData || {}) };
    const normalized = normalizeText(message);

    Object.assign(
        collectedData,
        extractKnownFieldsFromMessage(questions, normalized, collectedData)
    );

    const stepBefore = getCurrentStepFromCollected(questions, collectedData);
    const currentQuestion = questions[stepBefore];

    let answeredKey = null;
    if (currentQuestion) {
        const answer = extractAnswerForQuestion(currentQuestion, normalized);
        if (answer !== null && answer !== undefined) {
            collectedData[currentQuestion.key] = answer;
            answeredKey = currentQuestion.key;
        }
    }

    const currentStep = getCurrentStepFromCollected(questions, collectedData);

    return {
        ...state,
        collectedData,
        currentStep,
        questions,
        isComplete: currentStep >= questions.length,
        meta: {
            answeredKey,
            wasQuestion: isUserQuestion(normalized),
        },
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
    const templates = question.templates || [];

    // Pick random template for variety
    let text = templates.length
        ? templates[Math.floor(Math.random() * templates.length)]
        : "";

    // Replace placeholders like {name} with actual values
    for (const [key, value] of Object.entries(collectedData || {})) {
        text = text.replace(new RegExp(`\\{${key}\\}`, "gi"), value);
    }

    // Add suggestions if available
    if (question.suggestions) {
        const tag = question.multiSelect ? "MULTI_SELECT" : "SUGGESTIONS";
        text += `\n[${tag}: ${question.suggestions.join(" | ")}]`;
    }

    return withQuestionKeyTag(text, question.key);
}

/**
 * Check if we have enough info to generate proposal
 * @param {Object} state - Current conversation state
 * @returns {boolean}
 */
export function shouldGenerateProposal(state) {
    const questions = Array.isArray(state?.questions) ? state.questions : [];
    const collectedData = state?.collectedData || {};

    // Ready when every question has *some* value (including explicit skips).
    for (const q of questions) {
        if (!q?.key) continue;
        const val = collectedData[q.key];
        if (val === undefined || val === null || normalizeText(val) === "") {
            return false;
        }
    }
    return true;
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
    budget =
        collectedData.budget && collectedData.budget !== "[skipped]"
            ? collectedData.budget
            : "";
    timeline =
        collectedData.timeline && collectedData.timeline !== "[skipped]"
            ? collectedData.timeline
            : "";

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
    return getChatbot(service).openingMessage;
}
