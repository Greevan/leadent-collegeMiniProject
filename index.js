const express = require('express');
const app = express();
const axios = require('axios')
const OPENAI_API_KEY = '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';
const mongoose = require('mongoose')
const cors = require('cors')
mongoose.connect("mongodb+srv://dharan731:Asdfgh2014@cluster0.dcvhczd.mongodb.net/?retryWrites=true&w=majority").then(() => {
    console.log("Connected!");
})

// Middleware to parse JSON data
app.use(express.json());
app.use(cors())

const ExamSchema = new mongoose.Schema({
    testName : String,
    noOfQuestions: String,
    difficulty: String,
    questions : {
        type: mongoose.Schema.Types.Mixed,
        default: []
    }
});

const ExamModel = mongoose.model('ExamModel', ExamSchema);

app.get('/generate-quiz', async (req, res) => {
    const { course, difficulty, noOfQuestions, noOfOptions,testName } = req.query;

    const prompt = `
    
    Generate ${noOfQuestions} multiple choice questions with a difficulty level of ${difficulty} in the ${course} course, each having ${noOfOptions} choices. Format your response as a JSON array like this:
    
    [
        {"question": "", "options": [{"opt1": "", "opt2": "", ...}], "answer": "1"},
        {"question": "", "options": [{"opt1": "", "opt2": "", ...}], "answer": "<correct-answer>"},
        ...
    ]

    Ensure that the response strictly adheres to this format, with each question inserted into the array following this pattern:
    
    {"question": "", "options": [{"opt1": ""}, {"opt2": ""}, ...}], "answer": "1"}

    `;
  
    try {
      
      const response = await axios.post(
        'https://api.openai.com/v1/engines/text-davinci-003/completions',
        {
          prompt,
          max_tokens: 3000``, 
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
        }
      );
  
      const quizData = response.data.choices[0].text;

        console.log(quizData);
      const cleanedResponse = quizData.trim();
  
      
      const quizJSON = JSON.parse(cleanedResponse);

      const examObject = new ExamModel({
        testName,
        noOfQuestions,
        difficulty,
        questions : quizJSON
      })

      examObject.save().then(() => {
        res.redirect("http://127.0.0.1:5500/Frontend/quizGenerated.html");
      }).catch((err) => {
        res.status(500).json({ error: 'Quiz generation failed.' });
      })
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Quiz generation failed.' });
    }
});  

app.get('/getExams', async(req, res) => {
    try {
       
        const exams = await ExamModel.find({});
    
        res.status(200).json(exams);
      } catch (error) {
       
        res.status(500).send('Error fetching exams: ' + error.message);
      }
})

app.get('/getExam/:id', async(req, res) => {
    try {
        const examId = req.params.id;

        const exam = await ExamModel.findById(examId);

        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        res.status(200).json(exam);
    } catch (error) {
        res.status(500).send('Error fetching exam: ' + error.message);
    }
})


const port = 3000; // You can change this port as needed
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
