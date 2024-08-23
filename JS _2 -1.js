var isWaiting = false;
console.log(1, isWaiting);

var divNum = 0
var prevContents = ""

function onLoad() {
    const userInput = document.getElementById('user-input');
    userInput.focus();
}

function sendMessage() {
    const userInput = document.getElementById('user-input');
    const messageText = userInput.value.trim();
    userInput.disabled = true;
    userInput.placeholder = "Answering...";

    if (messageText === '' || isWaiting) return;
    console.log(2, isWaiting);

    // LLM API 호출
    var jsonData = {
        "model": "model-identifier",
        "messages": [
            { "role": "system", "content": "You are smart and helpful AI that answer the all question that has asked. " },
            { "role": "user", "content": prevContents+""+messageText}
        ],
        "temperature": 0.7,
        "max_tokens": -1,
        "stream": true
    }

    divNum++;
    $.ajax({
        url: 'http://localhost:3141/v1/chat/completions',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(jsonData),
        //dataType: 'json',
        xhrFields: {
            onreadystatechange: function(e) {
                var xhr = e.currentTarget;
                if (xhr.readyState === 3) { // Loading state with partial data
                    var newText = xhr.responseText;         
                    showResponseMsg(newText)
                }
            }
        },
        success: function (response) {
            userInput.placeholder = "Type a message...";
            userInput.disabled = false;
            userInput.focus();
        },
        error: function (xhr, status, error) {
            // 실패 시 실행할 코드
            console.log("error : " + error);
            userInput.placeholder = "Type a message...";
            userInput.disabled = false;
            userInput.focus();
        }
    });

    const messagesContainer = document.getElementById('chat-messages');

    // Replace newline characters with <br> for proper display
    var formattedUserMessage = messageText.replace(/\n/g, '<br>');
/*
    formattedUserMessage = formattedUserMessage.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
    formattedUserMessage = formattedUserMessage.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
*/
    const userMessage = document.createElement('div');
    userMessage.className = 'message user';
    userMessage.innerHTML = <div class="message-content">${formattedUserMessage}</div>;
    messagesContainer.appendChild(userMessage);

    // Set isWaiting to true
    isWaiting = true;

    // Clear input field
    userInput.value = '';
    autoResize(userInput); // Reset textarea height

    const botMessage = document.createElement('div');
    botMessage.id = 'bot-msg-'+divNum
    botMessage.className = 'message bot';
    botMessage.innerHTML = <div class="message-content"></div>;
    messagesContainer.appendChild(botMessage);
}

function showResponseMsg(messageText) {
    const messagesContainer = document.getElementById('chat-messages');

    // Simulate bot response
    setTimeout(() => {
        // 'data:' 문자열 제거
        const cleanedText = messageText.replace(/data:\s*/g, '').replace('[DONE]', '').trim();

        // 개별 JSON 객체들을 배열로 감싸기 위해 쉼표로 구분
        const jsonString = `[${cleanedText.trim().split('\n').filter(line => line).join(',')}]`;

        // JSON 문자열을 객체로 변환
        const jsonArray = JSON.parse(jsonString);

        // 콘텐츠 추출 및 문장 생성
        const sentence = jsonArray
        .map(chunk => chunk.choices[0].delta.content) // 각 델타의 콘텐츠 추출
        .join(''); // 콘텐츠를 공백으로 구분하여 결합

        // Replace newline characters with <br> for proper display
        const botResponseText = `${sentence}`;
        const bot_msg = document.getElementById('bot-msg-'+divNum);
        bot_msg.innerHTML = <div class="message-content">${botResponseText}</div>;

        prevContents = botResponseText

        // Set isWaiting to false
        isWaiting = false;

        // Scroll to the bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 1000);

    // Scroll to the bottom immediately
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function handleKeyPress(event) {
    const userInput = event.target;
    if (event.key === 'Enter' && !event.shiftKey) {
        sendMessage();
        event.preventDefault();  // Prevents a new line from being added
    } else if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault();
        userInput.value += '\n';
    }
    autoResize(userInput);
}

function onPasteProcess(event) {
    const userInput = event.target;
    setTimeout(function() {
        autoResize(userInput);
    }, 0);
}

function autoResize(textarea) {
    textarea.style.height = 'auto'; // Reset height to auto to allow shrinking
    textarea.style.height = textarea.scrollHeight + 'px'; // Set height based on scrollHeight
    textarea.scrollTop = textarea.scrollHeight;
}