// Backend for coding playground metadata (challenges definition).
// Code execution is still handled safely in the browser; this just
// serves the same challenge list used on the frontend.

// AI integration removed: backend will return fallback guidance without calling external APIs.

exports.getChallenges = async (req, res) => {
  try {
    const challenges = [
      {
        id: 1,
        title: 'Hello World',
        description:
          "Write a function named `solution` that returns the string 'Hello World'.",
        difficulty: 'Easy',
      },
      {
        id: 2,
        title: 'Sum of Two Numbers',
        description:
          'Write a function named `solution` that takes two numbers (a, b) and returns their sum.',
        difficulty: 'Easy+',
      },
      {
        id: 3,
        title: 'Is Even?',
        description:
          'Write a function named `solution` that returns true if a number is even, and false otherwise.',
        difficulty: 'Medium',
      },
      {
        id: 4,
        title: 'Find Maximum',
        description:
          'Write a function named `solution` that takes an array of numbers and returns the largest number.',
        difficulty: 'Hard',
      },
    ];

    res.json({ challenges });
  } catch (err) {
    console.error('Error getting playground challenges', err);
    res.status(500).json({ message: 'Failed to load challenges' });
  }
};

// AI Assistant endpoint for real-time code help
exports.getAIAssistance = async (req, res) => {
  try {
    const { message, code, challengeDescription, language } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Provide helpful fallback responses without external AI calls
    const lowerMessage = message.toLowerCase();
    
    let fallbackResponse = '';
    
    if (lowerMessage.includes('hint') || lowerMessage.includes('help')) {
      fallbackResponse = `Here's a hint for "${challengeDescription || 'this challenge'}":\n\n` +
        `• Read the problem description carefully\n` +
        `• Break down the problem into smaller steps\n` +
        `• Test your code with different inputs\n` +
        `• Check for common errors like syntax mistakes or logic issues\n\n` +
        `💡 Tip: Try to understand what the function should return and work backwards from there.`;
    } else if (lowerMessage.includes('explain') || lowerMessage.includes('what')) {
      fallbackResponse = `To solve "${challengeDescription || 'this challenge'}", you need to:\n\n` +
        `1. Understand the requirements\n` +
        `2. Think about the approach\n` +
        `3. Write the code step by step\n` +
        `4. Test your solution\n\n` +
        `The challenge asks you to ${challengeDescription || 'complete the task'}. ` +
        `Make sure your function handles all the test cases correctly.`;
    } else if (lowerMessage.includes('error') || lowerMessage.includes('wrong') || lowerMessage.includes('bug')) {
      fallbackResponse = `To debug your code:\n\n` +
        `• Check for syntax errors (missing brackets, semicolons, etc.)\n` +
        `• Verify your logic matches the problem requirements\n` +
        `• Test with simple inputs first\n` +
        `• Use console.log() to see what values your variables have\n` +
        `• Make sure you're returning the correct data type\n\n` +
        `Review your code carefully and compare it with the expected output.`;
    } else if (lowerMessage.includes('improve') || lowerMessage.includes('better')) {
      fallbackResponse = `To improve your code:\n\n` +
        `• Make sure it's readable and well-commented\n` +
        `• Check if there's a more efficient approach\n` +
        `• Ensure it handles edge cases\n` +
        `• Verify it follows best practices for ${language || 'the language'}\n\n` +
        `Keep practicing and refining your solutions!`;
    } else {
      fallbackResponse = `I understand you're asking about: "${message}"\n\n` +
        `For this challenge: "${challengeDescription || 'coding problem'}"\n\n` +
        `Here are some general tips:\n` +
        `• Read the problem statement carefully\n` +
        `• Break it down into smaller parts\n` +
        `• Write and test your code incrementally\n` +
        `• Don't hesitate to experiment!\n`;
    }

    return res.json({
      response: fallbackResponse,
      timestamp: new Date().toISOString(),
      fallback: true,
      note: 'AI service disabled; basic guidance returned.'
    });
  } catch (err) {
    console.error('Error getting AI assistance:', err);
    res.status(500).json({ 
      message: 'Failed to get AI assistance'
    });
  }
};


