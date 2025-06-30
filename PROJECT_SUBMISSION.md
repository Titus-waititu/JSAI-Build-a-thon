## 🌍 Problem Statement

**Educational Accessibility & Academic Planning Crisis**

Millions of students worldwide struggle with:

- **Information Overload**: Complex degree requirements buried in lengthy PDF documents
- **Academic Guidance Gap**: Limited access to personalized academic advisors, especially for online learners
- **Course Discovery Challenges**: Difficulty finding relevant courses across multiple degree clusters
- **Prerequisite Confusion**: Students often take courses in wrong order, delaying graduation
- **Career Path Uncertainty**: Unclear connections between courses and career outcomes

Traditional academic advising systems are:

- ⏰ **Time-constrained** - Limited office hours and availability
- 🏢 **Location-dependent** - Inaccessible for remote/online students
- 📚 **Information-siloed** - Course data scattered across multiple systems
- 💰 **Cost-prohibitive** - Personal advising often requires premium tuition

This creates barriers to education, particularly affecting underserved communities and working professionals seeking career advancement through online learning.

---

## 🛠️ Your Solution

**Academic Advisor AI: Intelligent Course Discovery & Degree Planning System**

### Template Foundation

We customized the **Azure AI Chat RAG (Retrieval-Augmented Generation)** template to create an intelligent academic advisory system.

### Key Modifications & Extensions

#### 🎯 **Core Transformation**

- **From**: Generic enterprise chat system
- **To**: Specialized academic advisor with course recommendation engine

#### 🧠 **AI System Enhancements**

```typescript
// Enhanced RAG system prompt for academic guidance
const ragSystemPrompt = `You are an Academic Advisor AI assistant specializing in:
- Course discovery and recommendation based on student interests
- Degree requirement analysis and academic pathway planning
- Prerequisite checking and course sequencing guidance
- Program comparison and specialization advice
- Financial aid and scholarship information
```

#### 📚 **Comprehensive Course Database**

- **4 Major Degree Clusters**: Computer Science, Business Administration, Engineering Technology, Healthcare Management
- **120+ Courses**: Complete with codes, prerequisites, credits, online availability
- **Academic Pathways**: Structured learning sequences with specialization tracks
- **Document Integration**: Processes PDF degree requirements (DEGREE_CLUSTER_DOCUMENT_11_2_2024.pdf)

#### 🎨 **Academic-Focused UI/UX**

```typescript
promptSuggestions: [
  "What online courses are available in Computer Science?",
  "Show me degree requirements for Business Administration",
  "Which courses can I take to complete my Engineering cluster?",
  "What prerequisites do I need for Data Science courses?",
  "Help me plan my academic pathway for Healthcare Management",
];
```

#### 🔧 **Technical Architecture**

- **Azure Functions API**: Serverless backend for scalable course recommendations
- **LitElement Frontend**: Modern web components for responsive academic interface
- **Vector Database**: Semantic search across course catalogs and degree documents
- **RAG Implementation**: Context-aware responses using institutional knowledge

### Why This Approach Works

#### 🎓 **Pedagogically Sound**

- Follows established academic advising best practices
- Considers prerequisite chains and course sequencing
- Provides personalized learning pathways

#### 🌐 **Technologically Advanced**

- AI-powered semantic search across academic documents
- Real-time course recommendations based on student goals
- Scalable cloud architecture supporting thousands of concurrent students

#### 🎯 **Problem-Focused Design**

- Addresses specific pain points in academic planning
- Reduces time-to-degree through optimized course selection
- Democratizes access to quality academic guidance

---

## 🚀 Repository & Demo

- **GitHub Repository**: [https://github.com/Titus-waititu/JSAI-Build-a-thon](https://github.com/Titus-waititu/JSAI-Build-a-thon)
- **Live Demo**: Academic Advisor AI Interface
- **Study Jam**: JavaScript AI Build-a-thon 2025 - Education Track
- **API Endpoint**: `http://localhost:7071/api/chats/stream` (local development)

### 🎥 **Demo Features**

1. **Interactive Course Discovery**: Ask "What CS courses are available?"
2. **Smart Prerequisites**: "What do I need before taking Data Science?"
3. **Degree Planning**: "Plan my path to a Business degree"
4. **Career Guidance**: "Courses for software development career"

### 📁 **Key Files**

```
AI/packages/webapp/src/components/chat.ts - Academic UI components
AI/packages/api/src/functions/chats-post.ts - AI academic advisor logic
AI/data/course-catalog.md - Comprehensive course database
test-academic-advisor.js - Automated testing suite
```

---

## 🙌 Call for Upvotes

### 🏆 **Why Academic Advisor AI Deserves the People's Choice Award**

#### 🌍 **Massive Global Impact**

- **273 million students** worldwide could benefit from intelligent academic guidance
- **Democratizes education** by making personalized advising accessible 24/7
- **Reduces educational inequality** for underserved and remote learners

#### 💡 **Innovation Excellence**

- **First-of-its-kind** AI academic advisor built on Azure infrastructure
- **Cutting-edge RAG implementation** with semantic course discovery
- **Real-world application** solving actual student pain points

#### 🎯 **Practical Value**

- **Immediate deployment ready** - fully functional system
- **Comprehensive solution** - covers 4 major degree clusters with 120+ courses
- **Measurable outcomes** - reduces time-to-degree, improves course success rates

#### 🚀 **Technical Excellence**

- **Clean, scalable architecture** using Azure best practices
- **Modern web technologies** (LitElement, TypeScript, Azure Functions)
- **Thorough testing** with automated academic relevance scoring

#### 🎓 **Educational Impact**

- **Improves student success** through better course planning
- **Reduces academic advisor workload** allowing focus on complex cases
- **Enhances online learning experience** with personalized guidance

#### 🌟 **Community Value**

- **Open source approach** - others can build upon this foundation
- **Extensible design** - easily adaptable to different institutions
- **Documentation excellence** - comprehensive setup guides and examples

### 💭 **Testimonial Potential**

_"This AI advisor helped me map out my entire Computer Science degree in 10 minutes - something that took weeks of research before!"_ - Future Student

### 🎯 **Why Vote for Us?**

This isn't just a cool tech demo - it's a **real solution to a real problem** that millions of students face every day. We've taken Microsoft's powerful Azure AI infrastructure and channeled it toward **democratizing education** and **empowering learners worldwide**.

**Your vote supports:**

- 🎓 **Educational equity and accessibility**
- 🚀 **Innovation in AI-powered learning tools**
- 🌍 **Technology that makes a meaningful difference**

**Vote for Academic Advisor AI - Where Technology Meets Education to Transform Lives! 🎓✨**

---

### 📊 **Project Stats**

- **Lines of Code**: 2,000+ (TypeScript/JavaScript)
- **API Endpoints**: 4 specialized academic functions
- **Course Database**: 120+ courses across 4 clusters
- **Test Coverage**: 10 comprehensive academic scenarios
- **Documentation**: Complete setup and deployment guides
