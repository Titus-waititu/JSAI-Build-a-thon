#!/usr/bin/env node

// Academic Advisor API Test Suite
// Tests course recommendation and degree planning functionality
// Run with: node test-academic-advisor.js

const apiUrl = "http://localhost:7071/api/chats/stream";

const testQueries = [
  "What online courses are available in Computer Science?",
  "Show me degree requirements for Business Administration",
  "I want to become a software developer, what courses should I take?",
  "What prerequisites do I need for Data Science courses?",
  "How long does it take to complete a Computer Science degree?",
  "What are the admission requirements for Engineering Technology?",
  "Can you help me plan my academic pathway for Healthcare Management?",
  "What financial aid options are available for online students?",
  "I have a background in business, can I transition to IT?",
  "What specialization tracks are available in the Computer Science program?",
];

async function testAcademicQuery(query) {
  console.log(`\n🎓 Testing academic query: "${query}"`);
  console.log("📚 Sending request to Academic Advisor API...\n");

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: query,
          },
        ],
        context: {
          sessionId: "academic-session-" + Date.now(),
          userId: "student-" + Date.now(),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("✅ Academic advice received! Streaming content:\n");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";
    let followUpQuestions = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.delta && parsed.delta.content) {
              const content = parsed.delta.content;
              process.stdout.write(content);
              fullResponse += content;

              // Extract follow-up questions
              const questionMatches = content.match(/<<(.+?)>>/g);
              if (questionMatches) {
                questionMatches.forEach((match) => {
                  const question = match.replace(/<<|>>/g, "");
                  if (!followUpQuestions.includes(question)) {
                    followUpQuestions.push(question);
                  }
                });
              }
            }
          } catch (e) {
            // Ignore parsing errors for incomplete JSON
          }
        }
      }
    }

    console.log("\n\n📊 Response Analysis:");
    console.log(`   📝 Response length: ${fullResponse.length} characters`);
    console.log(`   ❓ Follow-up questions found: ${followUpQuestions.length}`);

    if (followUpQuestions.length > 0) {
      console.log("   🔮 Suggested follow-ups:");
      followUpQuestions.forEach((q, i) => {
        console.log(`      ${i + 1}. ${q}`);
      });
    }

    // Check for academic keywords
    const academicKeywords = [
      "course",
      "credit",
      "prerequisite",
      "degree",
      "program",
      "semester",
      "major",
    ];
    const keywordCount = academicKeywords.filter((keyword) =>
      fullResponse.toLowerCase().includes(keyword)
    ).length;

    console.log(
      `   🏫 Academic relevance: ${keywordCount}/${academicKeywords.length} keywords found`
    );
    console.log("=".repeat(70));

    return {
      response: fullResponse,
      followUps: followUpQuestions,
      academicRelevance: keywordCount,
    };
  } catch (error) {
    console.error("❌ Error testing academic query:", error.message);
    return null;
  }
}

async function runAcademicTests() {
  console.log("🎓 Academic Advisor AI Test Suite");
  console.log("==================================\n");

  console.log("🔧 Testing API endpoint:", apiUrl);
  console.log("📚 Simulating student academic advisory sessions\n");

  let totalTests = 0;
  let successfulTests = 0;
  let totalAcademicRelevance = 0;

  // Run test queries
  for (const query of testQueries) {
    totalTests++;
    const result = await testAcademicQuery(query);

    if (result) {
      successfulTests++;
      totalAcademicRelevance += result.academicRelevance;
    }

    // Wait between tests to avoid overwhelming the API
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("\n📊 Test Summary:");
  console.log(`   ✅ Successful queries: ${successfulTests}/${totalTests}`);
  console.log(
    `   📈 Average academic relevance: ${(
      totalAcademicRelevance / successfulTests
    ).toFixed(1)}/7`
  );

  if (successfulTests === 0) {
    console.log("\n❌ All tests failed. Check:");
    console.log(
      "   1. API server is running (npm run start in AI/packages/api)"
    );
    console.log("   2. Environment variables in local.settings.json");
    console.log("   3. Course catalog document is uploaded to vector store");
  } else if (totalAcademicRelevance / successfulTests < 3) {
    console.log("\n⚠️  Low academic relevance. Consider:");
    console.log("   1. Updating the system prompt to be more academic-focused");
    console.log("   2. Adding more course and degree-related documents");
    console.log("   3. Training the model with academic vocabulary");
  } else {
    console.log("\n🎉 Academic Advisor is working well!");
  }

  console.log("\n💡 Next steps:");
  console.log("   - Test the webapp interface");
  console.log(
    "   - Upload the DEGREE_CLUSTER_DOCUMENT_11_2_2024.pdf to the vector store"
  );
  console.log("   - Configure Azure OpenAI for better performance");
}

// Run the tests
runAcademicTests().catch(console.error);
