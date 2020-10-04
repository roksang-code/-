
var usernamePage = document.querySelector('#username-page');	//사용자 이름 div
var chatPage = document.querySelector('#chat-page');			//채팅창 div
var usernameForm = document.querySelector('#usernameForm');		//사용자 이름form div
var messageForm = document.querySelector('#messageForm');		//채팅창 form div
var messageInput = document.querySelector('#message');			//채팅창 input
var messageArea = document.querySelector('#messageArea');		//채팅창 ul
var connectingElement = document.querySelector('.connecting');	//connect div

//STOMP = Simple/Streaming Text Oriented Messaging Protocol의 약자, 텍스트 기반의 메세징 프로토콜
var stompClient = null;
var username = null;

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

//소켓연결 함수
function connect(event) {
	//사용자 이름 받아오기
    username = document.querySelector('#name').value.trim();

    if(username) {
		//usernamePage에 hidden 클래스 추가
        usernamePage.classList.add('hidden');
		//chatPage에 hidden 쿨래스 삭제
        chatPage.classList.remove('hidden');

		//SockJS, Stomp관련 객체 생성, SockJS를 내부에 들고 있는 client에 내어준다.
        var socket = new SockJS('/ws');
		stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
    event.preventDefault();
}


function onConnected() {
    // /topic/public 구독
    stompClient.subscribe('/topic/public', onMessageReceived);

    // controller "/chat.addUser"에 username 전송
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({sender: username, contentType: "application/x-www-form-urlencoded; charset=UTF-8", type: 'JOIN'})
    )
	//connectingElement에 hidden 클래스 추가
    connectingElement.classList.add('hidden');
}


function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}


function sendMessage(event) {
	
    var messageContent = messageInput.value.trim();
    if(messageContent && stompClient) {
		//JSON으로 보낼 chatMessage 설정
        var chatMessage = {
            sender: username,
			contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            content: messageInput.value,
            type: 'CHAT'
        };
		//controller "/chat.sendMessage"에 chatMessage 전송
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        //messageInput 초기화
		messageInput.value = '';
    }
    event.preventDefault();
}


function onMessageReceived(payload) {
    // JSON 문자열의 구문을 분석 후 객체생성
	var message = JSON.parse(payload.body);

    var messageElement = document.createElement('li');

	//vo JOIN
    if(message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' 님 환영합니다!';
    //vo LEAVE
	} else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' left!';
    //vo CHAT
	} else {
        messageElement.classList.add('chat-message');
		//프로필 아이콘
        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]);
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender);

        messageElement.appendChild(avatarElement);

        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    }

    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

//프로필 아이콘 colors 리턴
function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % colors.length);
    return colors[index];
}

usernameForm.addEventListener('submit', connect, true)
messageForm.addEventListener('submit', sendMessage, true)