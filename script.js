const QuizApp = (() => {
    const apiKey = 'SRQkjOgModXzaPQwxkrdbmoZCVmC6IgnnFRcDKls';
    let selectedAnswers = [];
    let currentQuestionIndex = 0;
    let correctAnswersCount = 0;
    let questions = [];
    let correct_Answers = [];

    // State Management Module
    const StateManager = (() => {
        return {
            getCategory: () => new URLSearchParams(window.location.search).get('category'),
            saveAnswer: (questionIndex, answer) => selectedAnswers[questionIndex] = answer,
            getAnswer: (questionIndex) => selectedAnswers[questionIndex],
            resetState: (numQuestions) => {
                // selectedAnswers = Array(numQuestions).fill(null);
                currentQuestionIndex = 0;
                correctAnswersCount = 0;
            },
            incrementCorrectAnswers: () => correctAnswersCount++
        };
    })();

    // Fetch Module
    const FetchModule = (() => {
        const fetchCategoryQuestions = async (category) => {
            const url = `https://quizapi.io/api/v1/questions?apiKey=${apiKey}&limit=10&category=${category}`;
            const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
            return response.json();
        };
        return { fetchCategoryQuestions };
    })();

    // UI Module
    const UIModule = (() => {
        const quizContent = document.querySelector('.quiz-content');
        const progressBar = document.querySelector('.progress');
        const quizResultModal = document.querySelector(".quiz-result-modal");
        const quizQuitModal = document.querySelector('.quit-quiz-modal');

        const loadQuitQuizModal = () => {
            quizQuitModal.classList.toggle('hidden');
        }

        const updateProgressBar = (progressPercentage) => {
            progressBar.style.width = `${progressPercentage}%`;
            progressBar.style.setProperty('--progress-content', `"${progressPercentage}%"`);
        };

        // Inside the displayQuestion function in UIModule
const displayQuestion = (display_questions = {}, index = 0, total = 0) => {
    quizContent.querySelector('.question-order').textContent = `Question ${index} of ${total}`;
    quizContent.querySelector(".question").textContent = display_questions ? display_questions.question : null;
    const answerContainer = quizContent.querySelector(".answers");
    answerContainer.innerHTML = '';

    if (display_questions !== null) {
        Object.keys(display_questions.answers).forEach(key => {
            if (display_questions.answers[key]) {
                const answerOption = createAnswerOption(key, display_questions.answers[key], display_questions.id);
                answerContainer.appendChild(answerOption);

                // Add real-time background color change on selection
                const radioInput = answerOption.querySelector('input[type="radio"]');
                radioInput.addEventListener('change', () => {
                    // Remove background from previously selected option
                    answerContainer.querySelectorAll('label').forEach(label => {
                        label.classList.remove('border-pink-600');
                    });
                    // Add background color to the selected option
                    answerOption.querySelector('label').classList.add('border-pink-600');
                });
            }
        });
    }
    restoreSelectedAnswer(index);
};


        const createAnswerOption = (key, answerText, questionId) => {
            const answerOption = document.createElement('li');
            answerOption.classList.add('answer');
            answerOption.innerHTML = `
                <label for='${key}-${questionId}' class='w-full cursor-pointer px-4 py-2 border border-gray-400 gap-2 grid grid-cols-[1fr_auto]'><p class='block'>${answerText}</p><input type='radio' id='${key}-${questionId}' class='radio accent-pink-600' name='answer-radio-${questionId}' value='${key}'></label>
            `;
            return answerOption;
        };

        const restoreSelectedAnswer = (index) => {
            const savedAnswer = StateManager.getAnswer(index);
            if (savedAnswer) {
                const answerContainer = quizContent.querySelector(".answers");
                const selectedRadio = answerContainer.querySelector(`input[value='${savedAnswer}']`);
                if (selectedRadio) selectedRadio.checked = true;
            }
        };

        const showResults = (score, totalQuestions, correctAnswers, grade, finalResult) => {
            document.querySelector('.score span').textContent = `${score}%`;
            document.querySelector(".total-questions span").textContent = totalQuestions;
            document.querySelector('.correct-answers span').textContent = correctAnswers;
            document.querySelector('.topic span').textContent = StateManager.getCategory().toUpperCase();
            document.querySelector('.grade span').textContent = grade;
            document.querySelector('.final-result span').textContent = finalResult;
            quizResultModal.classList.remove('hidden');
        };

        return { displayQuestion, updateProgressBar, showResults, loadQuitQuizModal };
    })();

    // Controller for navigation
    const QuizController = (() => {
        const nextButton = document.querySelector('.next');
        const previousButton = document.querySelector('.previous');
        const continueQuizBtn = document.querySelector(".continue-btn");
        const quitQuizBtn = document.querySelector('.quit-quiz-btn');
        const category = StateManager.getCategory();

        const setupEventListeners = () => {
            nextButton.addEventListener('click', handleNext);
            previousButton.addEventListener('click', handlePrevious);
            continueQuizBtn.addEventListener('click', continueQuizSession);
            quitQuizBtn.addEventListener('click', quitQuizSession);
            window.addEventListener('beforeunload', handleBeforeUnload);
            window.addEventListener('popstate', handlePopState);
            history.pushState({ quizStarted: true }, 'Quiz', `?category=${category}`);
        };

        const continueQuizSession = () => {
            UIModule.loadQuitQuizModal();
            history.pushState({ quizStarted: true }, 'Quiz', `?category=${category}`);
            window.addEventListener('beforeunload', handleBeforeUnload);
        }

        const quitQuizSession = () => {
            UIModule.loadQuitQuizModal();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        }

        const handlePopState = (event) => {
            if (event.state && event.state.quizStarted) {
                UIModule.loadQuitQuizModal();
                window.removeEventListener('beforeunload', handleBeforeUnload);
            }
        }

        const handleBeforeUnload = (event) => {
            event.preventDefault();
            event.returnValue = '';
        }

        const handleNext = () => {
            history.pushState({ quizStarted: true }, 'Quiz', `?category=${category}`);
            saveUserAnswer();
            currentQuestionIndex++;

            if (currentQuestionIndex < questions.length) {  // Changed 'selectedAnswers' to 'questions'
                UIModule.updateProgressBar((100 / questions.length) * currentQuestionIndex);
                UIModule.displayQuestion(questions[currentQuestionIndex], currentQuestionIndex, questions.length);
                if (currentQuestionIndex === questions.length - 1) {
                    nextButton.querySelector('span').textContent = 'Submit';
                }
            } else {
                calculateResults();
            }
        };

        const handlePrevious = () => {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                nextButton.querySelector('span').textContent = 'Next';
                UIModule.updateProgressBar((100 / questions.length) * currentQuestionIndex);  // Changed 'selectedAnswers' to 'questions'
                UIModule.displayQuestion(questions[currentQuestionIndex], currentQuestionIndex, questions.length);
            }
        };

        const saveUserAnswer = () => {
            const selectedRadio = document.querySelector(".answers input[type='radio']:checked");
            if (selectedRadio) {
                StateManager.saveAnswer(currentQuestionIndex, selectedRadio.value);
               
            }
        };

        const getCorrectAnswer = (question) => {
            for (let key of Object.keys(question.correct_answers)) {
                if (question.correct_answers[key] === 'true') {
                    return key.replace('_correct', '');
                }
            }
            return null;
        };


        const calculateResults = () => {

            let correctAnswers = 0;
            selectedAnswers.forEach((answer, index) => {
                const correctAnswer = getCorrectAnswer(questions[index]);
                if (answer === correctAnswer) correctAnswers++;
            });

            const score = (correctAnswers / questions.length) * 100;
            let grade = '';
            let finalResult = '';
            if (score >= 90) {
                grade = 'A';
            } else if (score >= 80) {
                grade = 'B';
            } else if (score >= 70) {
                grade = 'C';
            } else if (score >= 60) {
                grade = 'D';
            } else {
                grade = 'F';
            }

            if (score <= 70) {
                finalResult = 'Failed'
            } else {
                finalResult = 'Passed'
            }
            UIModule.showResults(score, questions.length, correctAnswers, grade, finalResult);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            UIModule.updateProgressBar((100 / questions.length) * currentQuestionIndex);
            UIModule.displayQuestion(null, currentQuestionIndex, questions.length);
        };

        return { setupEventListeners };
    })();

    // Main initialization function
    const init = async () => {
        const category = StateManager.getCategory();
        if (category) {
            questions = await FetchModule.fetchCategoryQuestions(category);  // Store questions in a global variable
            StateManager.resetState(questions.length);
            QuizController.setupEventListeners();
            UIModule.displayQuestion(questions[currentQuestionIndex], currentQuestionIndex, questions.length);
        }
    };

    return { init };
})();

// Initialize the app on DOM content loaded
document.addEventListener('DOMContentLoaded', QuizApp.init);
