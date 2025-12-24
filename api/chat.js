export default async function handler(req, res) {
  // ========================================
  // ALLOWED DOMAINS - ADD YOUR CHATBOT DOMAINS HERE
  // ========================================
  
  const ALLOWED_DOMAINS = [
    // "spine-doc-chatbot.vercel.app" --> ENTER YOUR DEPLOYMENT DOMAIN HERE
  ];

  // Localhost for testing
  const DEV_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
  ];

  // ========================================
  // BUILD ALLOWED ORIGINS
  // ========================================

  const allowedOrigins = [];
  ALLOWED_DOMAINS.forEach((domain) => {
    allowedOrigins.push(`https://${domain}`);
    allowedOrigins.push(`https://www.${domain}`);
  });
  allowedOrigins.push(...DEV_ORIGINS);

  // ========================================
  // VALIDATE REQUEST ORIGIN
  // ========================================

  const origin = req.headers.origin || "";
  const referer = req.headers.referer || req.headers.referrer || "";

  const isAllowedOrigin = allowedOrigins.some(
    (allowed) => origin.toLowerCase() === allowed.toLowerCase()
  );

  const isFromAllowedDomain = ALLOWED_DOMAINS.some((domain) => {
    const normalizedDomain = domain.toLowerCase();
    const normalizedReferer = referer.toLowerCase();
    const normalizedOrigin = origin.toLowerCase();

    return (
      normalizedReferer.includes(`://${normalizedDomain}`) ||
      normalizedReferer.includes(`://www.${normalizedDomain}`) ||
      normalizedReferer.includes(`.${normalizedDomain}`) ||
      normalizedOrigin.includes(`://${normalizedDomain}`) ||
      normalizedOrigin.includes(`://www.${normalizedDomain}`) ||
      normalizedOrigin.includes(`.${normalizedDomain}`)
    );
  });

  const isFromLocalhost =
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    referer.includes("localhost") ||
    referer.includes("127.0.0.1");

  // ========================================
  // SECURITY: BLOCK UNAUTHORIZED ACCESS
  // ========================================

  const isAuthorized = isFromAllowedDomain || isFromLocalhost;

  if (!isAuthorized) {
    console.log("🚫 BLOCKED:", { origin, referer });
    return res.status(403).json({
      error: "Access denied: Unauthorized domain",
    });
  }

  // ========================================
  // SET CORS HEADERS
  // ========================================

  if (isAllowedOrigin || isFromLocalhost) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", `https://${ALLOWED_DOMAINS[0]}`);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // ========================================
  // HANDLE PREFLIGHT
  // ========================================

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ========================================
  // VALIDATE REQUEST BODY
  // ========================================

  const { Text, UserName, SourceName, SessionId, Context, is_draft } = req.body;

  if (!Text && Text !== "") {
    return res.status(400).json({ error: "Text is required" });
  }

  // ========================================
  // CHECK ENVIRONMENT VARIABLES
  // ========================================

  const PERSONAL_AI_API_KEY = process.env.PERSONAL_AI_API_KEY;
  const DOMAIN_NAME = process.env.DOMAIN_NAME;
  const PERSONAL_AI_API_URL =
    process.env.PERSONAL_AI_API_URL ||
    "https://api-enterprise.personal.ai/v1/message/stream";

  if (!PERSONAL_AI_API_KEY) {
    console.error("❌ PERSONAL_AI_API_KEY not configured");
    return res.status(500).json({ error: "Service configuration error" });
  }

  if (!DOMAIN_NAME) {
    console.error("❌ DOMAIN_NAME not configured");
    return res.status(500).json({ error: "Service configuration error" });
  }

  // ========================================
  // CALL PERSONAL AI API
  // ========================================

  try {
    const requestBody = {
      Text: Text,
      UserName: UserName || "anonymous@user.com",
      SourceName: SourceName || "WebChat",
      SessionId: SessionId || `session_${Date.now()}`,
      DomainName: DOMAIN_NAME,
      is_draft: is_draft || false,
    };

    // Add Context if provided
    if (Context) {
      requestBody.Context = Context;
    }

    console.log("📤 Sending to Personal AI:", {
      UserName: requestBody.UserName,
      SourceName: requestBody.SourceName,
      DomainName: requestBody.DomainName,
    });

    const personalAiResponse = await fetch(PERSONAL_AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": PERSONAL_AI_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!personalAiResponse.ok) {
      console.error(
        "❌ Personal AI API error:",
        personalAiResponse.status,
        personalAiResponse.statusText
      );
      return res.status(personalAiResponse.status).json({
        error: "Failed to get response from AI service",
      });
    }

    // ========================================
    // STREAM RESPONSE
    // ========================================

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = personalAiResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "") continue;

          try {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();

              if (data === "[DONE]" || data === "") {
                continue;
              }

              try {
                const parsedData = JSON.parse(data);
                // Just pass through the response as-is
                res.write(`data: ${JSON.stringify(parsedData)}\n\n`);
              } catch (parseError) {
                // If not JSON, wrap it
                res.write(`data: ${JSON.stringify({ ai_message: data })}\n\n`);
              }
            }
          } catch (error) {
            console.error("Error processing streaming line:", error);
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        try {
          if (buffer.startsWith("data: ")) {
            const data = buffer.slice(6).trim();
            try {
              const parsedData = JSON.parse(data);
              res.write(`data: ${JSON.stringify(parsedData)}\n\n`);
            } catch (parseError) {
              res.write(`data: ${JSON.stringify({ ai_message: data })}\n\n`);
            }
          }
        } catch (error) {
          console.error("Error processing remaining buffer:", error);
        }
      }
    } catch (streamError) {
      console.error("❌ Streaming error:", streamError);
      res.write(
        `data: ${JSON.stringify({
          ai_message: "I apologize, but I encountered an error. Please try again.",
        })}\n\n`
      );
    }

    res.end();
  } catch (error) {
    console.error("❌ API Handler Error:", error);
    res.setHeader("Content-Type", "text/plain");
    res.write(
      `data: ${JSON.stringify({
        ai_message: "I apologize, but I'm having trouble responding right now. Please try again.",
      })}\n\n`
    );
    res.end();
  }
}
