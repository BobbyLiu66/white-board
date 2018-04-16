$(function () {
    const socket = io();
    let FADE_TIME = 150; // ms
    let TYPING_TIMER_LENGTH = 400; // ms
    let COLORS = [
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];
    // Initialize letiables
    // Prompt for setting a username
    let inviteFriend, roomState, friendState;
    let connected = false;
    let typing = false;
    let lastTypingTime;
    let dateTime;

    let $window = $(window);
    let $usernameInput = $('.usernameInput'); // Input for username
    let $passwordInput = $('.passwordInput');
    let $roomnameInput = $('.roomnameInput');
    let $inviteFriend = $('.inviteInput');
    let $messages = $('.messages'); // Messages area
    let $inputMessage = $('.inputMessage'); // Input message input box
    let $currentInput = $usernameInput.focus();

    let $loginPage = $('.login.page'); // The login page
    let $chatPage = $('.chat.page'); // The chatroom page
    $roomnameInput.hide();
    $inviteFriend.hide();
    //events
    if (window.sessionStorage.username !== undefined) {
        $loginPage.hide();
        $chatPage.show();
        $loginPage.off('click');
        $currentInput = $inputMessage.focus();
        connected = true;
        socket.emit('add user', window.sessionStorage.username, window.sessionStorage.roomName)
    }

    //clear message
    $('#clearChat').click(function () {
        $('.messages > li').remove()
    });

    //create room
    $('#newRoom').click(function () {
        $('h3.title').text('Input your room name');
        $usernameInput.hide();
        $passwordInput.hide();
        $inviteFriend.hide();
        $roomnameInput.show();
        $chatPage.fadeOut();
        $loginPage.show();
        $roomnameInput.focus();
        roomState = true
    });

    //invite friend
    $('#invite').click(function () {
        $('h3.title').text('Input your friend name');
        $usernameInput.hide();
        $passwordInput.hide();
        $roomnameInput.hide();
        $inviteFriend.show();
        $chatPage.fadeOut();
        $loginPage.show();
        $inviteFriend.focus();
        friendState = true
    });

    // Sets the client's username
    function setUsername() {
        let nickname = cleanInput($usernameInput.val().trim());
        let password = cleanInput($passwordInput.val().trim());
        //TODO login success there should be a block say something
        if (nickname && password) {
            socket.emit('check user', nickname, password);
        }
        else {
            alert("You need to fill in the form")
        }
    }

    // Sets the room's name
    function setRoomName() {
        let roomID = cleanInput($roomnameInput.val().trim());
        //TODO a close button
        if (roomID === window.sessionStorage.roomName) {
            alert('You have already in this room');
            $roomnameInput.val('');
            $roomnameInput.focus()
        }
        else if (roomID) {
            // Tell the server your username and roomName
            socket.emit('create room', {roomName: roomID, owner: window.sessionStorage.username});
        }
        else {
            alert('You need to write the room name');
            $roomnameInput.val('');
            $roomnameInput.focus()
        }
    }

    // Send invite message to a person
    function sendInviteMessage() {
        let friendName = cleanInput($inviteFriend.val().trim());
        //TODO a close button
        if (friendName === window.sessionStorage.username) {
            alert('You cannot invite yourself');
            $inviteFriend.val('');
            $inviteFriend.focus()
        }
        else if (friendName) {
            socket.emit('invite user', {inviteName: friendName, username: window.sessionStorage.username});
        }
        else {
            alert('You need to fill your friend name');
            $inviteFriend.val('');
            $inviteFriend.focus()
        }
    }

    // Sends a chat message
    function sendMessage() {
        let message = $inputMessage.val();
        // Prevent markup from being injected into the message
        message = cleanInput(message);
        // if there is a non-empty message and a socket connection
        if (message && connected) {
            $inputMessage.val('');
            // tell server to execute 'new message' and send along one parameter
            socket.emit('new message', message);
        }
    }

    // Log a message
    function log(message, options) {
        let $el = $('<li>').addClass('log').text(message);
        addMessageElement($el, options);
    }

    function logWithStyle(message, options) {
        let $usernameDiv = $('<span/>')
            .text(options.username)
            .css('color', getUsernameColor(options.username));
        let $accept = $('<button class="acceptOrDecline"/>')
            .text("accept").click(function () {
                socket.emit('accept invite', {
                    roomName: options.roomName,
                    username: window.sessionStorage.username
                });
                $(this).parent().children('button').attr("disabled", true)
            });
        let $decline = $('<button class="acceptOrDecline"/>')
            .text("decline").click(function () {
                socket.emit('decline invite', {
                    roomName: options.roomName,
                    username: options.username,
                    inviteUser: window.sessionStorage.username
                });
                $(this).parent().children('button').attr("disabled", true)
            });

        let $messageDiv = $('<li class="log"/>')
            .append($usernameDiv, message + options.roomName + " ", $accept, " or ", $decline);
        addMessageElement($messageDiv);
    }

    // Adds the visual chat message to the message list
    function addChatMessage(data, options) {
        // Don't fade the message in if there is an 'X was typing'
        let $typingMessages = getTypingMessages(data);
        options = options || {};
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }

        let $usernameDiv = $('<span class="username"/>')
            .text(data.username)
            .css('color', getUsernameColor(data.username));
        let $messageBodyDiv = $('<span class="messageBody">')
            .text(data.message);

        let typingClass = data.typing ? 'typing' : '';
        let $messageDiv = $('<li class="message"/>')
            .data('username', data.username)
            .addClass(typingClass)
            .append($usernameDiv, $messageBodyDiv);

        addMessageElement($messageDiv, options);
    }

    //load chat history message
    function loadChatMessage(data, options) {

        let $usernameDiv = $('<span class="username"/>')
            .text(data.username)
            .css('color', getUsernameColor(data.username));
        let $messageBodyDiv = $('<span class="messageBody">')
            .text(data.message);

        let $messageDiv = $('<li class="message"/>')
            .data('username', data.username)
            .append($usernameDiv, $messageBodyDiv);

        addMessageElement($messageDiv, options);
    }

    // Adds the visual chat typing message
    function addChatTyping(data) {
        data.typing = true;
        data.message = 'is typing';
        addChatMessage(data);
    }

    // Removes the visual chat typing message
    function removeChatTyping(data) {
        getTypingMessages(data).fadeOut(function () {
            $(this).remove();
        });
    }

    // Adds a message element to the messages and scrolls to the bottom
    // el - The element to add as a message
    // options.fade - If the element should fade-in (default = true)
    // options.prepend - If the element should prepend
    //   all other messages (default = false)
    function addMessageElement(el, options) {
        let $el = $(el);

        // Setup default options
        if (!options) {
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }

        // Apply options
        if (options.fade) {
            $el.hide().fadeIn(FADE_TIME);
        }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
        }
        $messages[0].scrollTop = $messages[0].scrollHeight;
    }

    // Prevents input from having injected markup
    function cleanInput(input) {
        return $('<div/>').text(input).html();
    }

    // Updates the typing event
    function updateTyping() {
        if (connected) {
            if (!typing) {
                typing = true;
                socket.emit('typing');
            }
            lastTypingTime = (new Date()).getTime();

            setTimeout(function () {
                let typingTimer = (new Date()).getTime();
                let timeDiff = typingTimer - lastTypingTime;
                if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                    socket.emit('stop typing');
                    typing = false;
                }
            }, TYPING_TIMER_LENGTH);
        }
    }

    // Gets the 'X is typing' messages of a user
    function getTypingMessages(data) {
        return $('.typing.message').filter(function () {
            return $(this).data('username') === data.username;
        });
    }

    // Gets the color of a username through our hash function
    function getUsernameColor(username) {
        // Compute hash code
        let hash = 7;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }
        // Calculate color
        let index = Math.abs(hash % COLORS.length);
        return COLORS[index];
    }

    // Keyboard events
    $window.keydown(function (event) {
        // When the client hits ENTER on their keyboard
        if (event.which === 13) {
            if (window.sessionStorage.username) {
                sendMessage();
                socket.emit('stop typing');
                typing = false;
            } else {
                setUsername();
            }
            if (roomState) {
                setRoomName();
                $roomnameInput.val('')
            }
            if (friendState) {
                sendInviteMessage();
                $inviteFriend.val('')
            }
        }
    });

    $inputMessage.on('input', function () {
        updateTyping();
    });

    // Click events

    // Focus input when clicking anywhere on login page
    $loginPage.click(function () {
        $currentInput.focus();
    });

    // Focus input when clicking on the message input's border
    $inputMessage.click(function () {
        $inputMessage.focus();
    });

    // Socket events

    // Whenever the server emits 'login', log the login message
    socket.on('login', function (data) {
        $loginPage.fadeOut();
        $chatPage.show();
        $loginPage.off('click');
        $currentInput = $inputMessage.focus();
        window.sessionStorage.username = data.username;
        window.sessionStorage.roomName = data.roomName;
        $usernameInput.val('');
        $passwordInput.val('');
        connected = true;
        // Display the welcome message
        const message = "Welcome to Chat " + data.roomName;
        log(message, {
            prepend: true
        });
    });

    socket.on('login fail', function (data) {
        alert(data.err);
        $usernameInput.val('');
        $passwordInput.val('');
        $usernameInput.focus()
    });

    socket.on('create room fail', function (data) {
        alert(data.err);
        $roomnameInput.val('');
        $usernameInput.focus()
    });

    socket.on('invite fail', function (data) {
        alert(data.err);
        $inviteFriend.val('');
        $inviteFriend.focus()
    });
    // Whenever the server emits 'new message', update the chat body
    socket.on('new message', function (data) {
        let now = (new Date()).getMinutes();
        if (now !== dateTime) {
            dateTime = now;
            let minutes = (new Date()).getMinutes() < 10 ? "0" + (new Date()).getMinutes() : (new Date()).getMinutes();
            log((new Date()).getHours() + ":" + minutes);
        }
        addChatMessage(data);
    });

    socket.on('decline invite', function (data) {
        log(data.username + ' decline to join your room')
    });

    socket.on('load history', function (data) {
        let flagMinutes, flag = true;
        _.forEach(data, function (value) {
            let messageTime = new Date(value.messageTime);
            if (flag || (messageTime.getMinutes() - 5) >= flagMinutes) {
                flagMinutes = messageTime.getMinutes();
                let minutes = messageTime.getMinutes() < 10 ? "0" + messageTime.getMinutes() : messageTime.getMinutes();
                log(messageTime.getHours() + ":" + minutes)
            }
            flag = false;
            loadChatMessage(value)
        });

        log('chat history loaded')
    });

    socket.on('create room', function (data) {
        window.sessionStorage.roomName = data.roomName;
        $loginPage.fadeOut();
        $chatPage.show();
        $loginPage.off('click');
        socket.emit('user left', data);
        roomState = false;
        $('.messages > li').remove();
        log(data.roomName + ' created successfully')
    });

    socket.on('invite user', function (data) {
        inviteFriend = data.inviteName;
        $loginPage.fadeOut();
        $chatPage.show();
        $loginPage.off('click');
        friendState = false;
        logWithStyle(' invite you to join room ', data)
    });


    socket.on('invite success', function (data) {
        inviteFriend = data.inviteName;
        $loginPage.fadeOut();
        $chatPage.show();
        $loginPage.off('click');
        friendState = false;
        log('invite ' + inviteFriend + ' success')
    });

    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', function (data) {
        if (data.roomName) {
            log(data.username + ' joined to room: ' + data.roomName);
            window.sessionStorage.roomName = data.roomName;
        }
        else {
            log(data.username + ' joined');
        }
    });
    // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', function (data) {
        if (data.otherRoom) {
            log(data.username + ' go to other room');
        }
        else {
            log(data.username + ' left');
        }
        removeChatTyping(data);
    });

    // Whenever the server emits 'typing', show the typing message
    socket.on('typing', function (data) {
        addChatTyping(data);
    });

    // Whenever the server emits 'stop typing', kill the typing message
    socket.on('stop typing', function (data) {
        removeChatTyping(data);
    });

    socket.on('disconnect', function () {
        log('you have been disconnected');
    });

    socket.on('reconnect', function () {
        log('you have been reconnected');
        if (window.sessionStorage.username) {
            console.log(window.sessionStorage);
            socket.emit('add user', window.sessionStorage.username,window.sessionStorage.roomName);
        }
    });

    socket.on('reconnect_error', function () {
        log('attempt to reconnect has failed');
    });

});