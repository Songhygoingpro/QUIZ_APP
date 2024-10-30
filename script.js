document.addEventListener('DOMContentLoaded', () => {
    let apiKey = 'SRQkjOgModXzaPQwxkrdbmoZCVmC6IgnnFRcDKls';

    // Get category parameter from the URL
    function getCategoryFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('category');
    }

    // Fetch quiz questions based on the category
    function fetchCategory(category) {
        const url = `https://quizapi.io/api/v1/questions?apiKey=${apiKey}&limit=10&category=${category}`;

        fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        })
            .then(response => response.json())
            .then(data => {
                // Call the function to display questions
                displayQuestion(data);
            })
            .catch(err => {
                console.error('Error fetching quiz data:', err);
            });
    }
    
    // Fetch questions when category is available
    const category = getCategoryFromUrl();
    if (category) {
        fetchCategory(category);
    }

    // Modal and navigation setup
    const continueQuizBtn = document.querySelector(".continue-btn");
    const quizModal = document.querySelector('.quit-quiz-modal');
    const quitQuizBtn = document.querySelector('.quit-quiz-btn');

    function handleBeforeUnload(event) {
        
        event.preventDefault();
        event.returnValue = ''; // Necessary for modern browsers
        
    }

    window.addEventListener('popstate', function (event) {
        if (event.state && event.state.quizStarted) {
            quizModal.classList.toggle('hidden');
            window.removeEventListener('beforeunload', handleBeforeUnload);
        }
    });
    


    continueQuizBtn.addEventListener("click", () => {
        quizModal.classList.toggle('hidden');
        window.addEventListener('beforeunload', handleBeforeUnload);
    });

    quitQuizBtn.addEventListener("click", () => {
        quizModal.classList.toggle('hidden');
        window.removeEventListener('beforeunload', handleBeforeUnload);
    });

  

    // Display questions and manage navigation
    function displayQuestion(data) {
        const quizContent = document.querySelector('.quiz-content');
        const questionOrderElement = quizContent.querySelector('.question-order');
        const questionElement = quizContent.querySelector(".question");
        const answerContainer = quizContent.querySelector(".answers");

        // Array to store selected answers
        const selectedAnswers = Array(data.length).fill(null);
        let currentQuestionIndex = 0;
        let correctAnswersCount = 0;

        const nextButton = document.querySelector('.next');
        const previousButton = document.querySelector('.previous');
        const progressBar = document.querySelector('.progress');
        const quizResultModal = document.querySelector(".quiz-result-modal");
        const scoreElement = document.querySelector('.score span');
        const totalQuestionsElement = document.querySelector(".total-questions span");
        const correctAnswerElement = document.querySelector('.correct-answers span');
        const topicElement = document.querySelector('.topic span');
        const gradeElement = document.querySelector(".grade span");
        const finalResultElement = document.querySelector(".final-result span");
        const quizResultDescription = document.querySelector(".quiz-result-description");
        const resultScoreBar = document.querySelector(".result-score-bar span");

        updateQuestion();
        window.addEventListener('beforeunload', handleBeforeUnload);
        history.pushState({ quizStarted: true }, 'Quiz', `?category=${category}`);

        // Handle "Next" button click
        nextButton.addEventListener('click', () => {
            const usersAnswer = document.querySelectorAll(".answer input[type='radio']:checked");
            currentQuestionIndex++;
            let progressWidth = (10 * currentQuestionIndex) + '%';
            progressBar.style.transition = 'width 0.5s ease-in-out';
            progressBar.style.width = progressWidth;
            progressBar.style.setProperty('--progress-content', `"${progressWidth}"`);
            history.pushState({ quizStarted: true }, 'Quiz', `?category=${category}`);
            // Save user's answer
            usersAnswer.forEach(userAnswer => {
                selectedAnswers[currentQuestionIndex - 1] = userAnswer.value;
            });

            if (currentQuestionIndex < data.length) {
                if (currentQuestionIndex === data.length - 1) {
                    nextButton.querySelector('.next_text').textContent = 'Submit';
                    window.removeEventListener('beforeunload', handleBeforeUnload);
                }
                updateQuestion();
            } else {
                calculateResults();
            }
        });

        // Handle "Previous" button click
        previousButton.addEventListener("click", () => {
            if (currentQuestionIndex > 0) {
                const progressWidth = (10 * (currentQuestionIndex - 1)) + '%';
                progressBar.style.width = progressWidth;
                progressBar.style.setProperty('--progress-content', `"${progressWidth}"`);
                currentQuestionIndex--;
                nextButton.querySelector('.next_text').textContent = 'Next';
                updateQuestion();
            }
        });

        // Function to display a new question
        function updateQuestion() {
            const currentQuestion = data[currentQuestionIndex];
            questionOrderElement.textContent = `Question ${currentQuestionIndex + 1} of ${data.length}`;
            questionElement.textContent = currentQuestion.question;
            answerContainer.innerHTML = '';

            Object.keys(currentQuestion.answers).forEach(key => {
                if (currentQuestion.answers[key]) {
                    const answerOption = createAnswerOption(key, currentQuestion.answers[key], currentQuestion.id);
                    answerContainer.appendChild(answerOption);
                }
            });

            console.log(selectedAnswers);

            // Restore selected answer if exists
            if (selectedAnswers[currentQuestionIndex] !== null) {
                const selectedValue = selectedAnswers[currentQuestionIndex];
                const selectedRadio = answerContainer.querySelector(`input[value='${selectedValue}']`);
                if (selectedRadio) {
                    selectedRadio.checked = true; // Keep the selected answer checked
                }
            }

            handleAnswerSelection();
        }

        // Create a list item for each answer option
        function createAnswerOption(key, answerText, id) {
            const answerOption = document.createElement('li');
            answerOption.classList.add('answer', 'flex', 'justify-between', 'gap-2', 'px-4', 'py-2', 'border', 'border-gray-400', 'cursor-pointer');
            answerOption.innerHTML = `
                <label for='${key}-${id}'>${answerText}</label>
                <input type='radio' id='${key}-${id}' class='radio accent-pink-600' name='answer-radio-${id}' value='${key}'>
            `;
            return answerOption;
        }

        // Handle answer selection and styling logic
        function handleAnswerSelection() {
            const answerBlocks = document.querySelectorAll('.answer');
            answerBlocks.forEach(answer => {
                const radio = answer.querySelector('.radio');

                answer.addEventListener('click', () => {
                    if (!radio.checked) {
                        radio.checked = true;
                    }

                    answerBlocks.forEach(block => {
                        const otherRadio = block.querySelector('.radio');
                        if (otherRadio !== radio) {
                            otherRadio.checked = false;
                            block.classList.remove('border-pink-500', 'border-l-8');
                            block.classList.add('border-gray-400');
                        } else {
                            block.classList.add('border-pink-500', 'border-l-8');
                            block.classList.remove('border-gray-400');
                        }
                    });

                    // Save the selected answer in the array
                    selectedAnswers[currentQuestionIndex] = radio.value;
                });
            });
        }

        // Calculate results after the last question
        function calculateResults() {
            const usersAnswer = document.querySelectorAll(".answer input[type='radio']:checked");
            let correctAnswer = '';

            data.forEach((dataItem, index) => {
                Object.keys(dataItem.correct_answers).forEach((correctKey) => {
                    if (dataItem.correct_answers[correctKey] === 'true') {
                        correctAnswer = correctKey.replace("_correct", '');
                    }
                });

                if (selectedAnswers[index] === correctAnswer) {
                    correctAnswersCount++;
                }
            });

            scoreElement.textContent = (correctAnswersCount / data.length) * 100 + '%';
            totalQuestionsElement.textContent = data.length;
            correctAnswerElement.textContent = correctAnswersCount;
            resultScoreBar.style.width = parseFloat(scoreElement.textContent) + '%';
            for (let i = 0; i < data.length; i++) {
                topicElement.textContent = data[0].category;
            }

            assignGrade();
            showResult();
        }

        // Assign grade based on score
        function assignGrade() {
            const scorePercentage = parseFloat(scoreElement.textContent);
            if (scorePercentage >= 90) {
                gradeElement.textContent = 'A';
            } else if (scorePercentage >= 80) {
                gradeElement.textContent = 'B';
            } else if (scorePercentage >= 70) {
                gradeElement.textContent = 'C';
            } else if (scorePercentage >= 60) {
                gradeElement.textContent = 'D';
            } else {
                gradeElement.textContent = 'F';
            }
        }

        // Show the result in the modal
        function showResult() {
            const scorePercentage = parseFloat(scoreElement.textContent);
            if (scorePercentage < 70) {
                finalResultElement.textContent = "Failed";
                quizResultDescription.textContent = "Better luck next time!";
            } else {
                finalResultElement.textContent = "Passed";
                quizResultDescription.textContent = "Congratulations!";
            }
            quizResultModal.classList.remove('hidden');
        }
    }
});
