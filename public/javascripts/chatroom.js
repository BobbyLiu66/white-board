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
    let username, roomName, inviteFriend, roomState, friendState;
    let connected = false;
    let typing = false;
    let lastTypingTime;
    let dateTime;

    let $window = $(window);
    let $usernameInput = $('.usernameInput'); // Input for username
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
    if (window.sessionStorage.username) {
        $loginPage.hide();
        $chatPage.show();
        $loginPage.off('click');
        $currentInput = $inputMessage.focus();
        username = window.sessionStorage.username;
        connected = true;
        socket.emit('add user', username, window.sessionStorage.roomName)
    }

    //clear message
    $('#clearChat').click(function () {
        $('.messages > li').remove()
    });

    //create room
    $('#newRoom').click(function () {
        $('h3.title').text('Input your room name');
        $usernameInput.hide();
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
        $roomnameInput.hide();
        $inviteFriend.show();
        $chatPage.fadeOut();
        $loginPage.show();
        $inviteFriend.focus();
        friendState = true
    });

    // Sets the client's username

    //TODO change the press ENTRY way to login. both value need to be checked
    function setUsername() {
        //TODO send ajax to check username unique
        username = cleanInput($usernameInput.val().trim());
        //TODO add password
        let password = cleanInput($passwordInout.val().trim());
        // If the username is valid
        //TODO check username unique
        if (username && password) {
            $loginPage.fadeOut();
            $chatPage.show();
            $loginPage.off('click');
            $currentInput = $inputMessage.focus();

            // Tell the server your username
            socket.emit('add user', username);
            //TODO after check add this should be implement this in login function
            window.sessionStorage.username = username
        }
    }

    // Sets the room's name
    function setRoomName() {
        roomName = cleanInput($roomnameInput.val().trim());
        if (roomName) {
            $loginPage.fadeOut();
            $chatPage.show();
            $loginPage.off('click');
            // Tell the server your username and roomName
            socket.emit('create room', {roomName: roomName, owner: username});
            window.sessionStorage.roomName = roomName
        }
    }

    function sendInviteMessage() {
        inviteFriend = cleanInput($inviteFriend.val().trim());
        if (inviteFriend) {
            $loginPage.fadeOut();
            $chatPage.show();
            $loginPage.off('click');
            socket.emit('invite user', {inviteName: inviteFriend, username: username});
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
                    username: username
                });
                $(this).parent().children('button').attr("disabled", true)
            });
        let $decline = $('<button class="acceptOrDecline"/>')
            .text("decline").click(function () {
                socket.emit('decline invite', {
                    roomName: options.roomName,
                    username: options.username,
                    inviteUser: username
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
            if (username) {
                sendMessage();
                socket.emit('stop typing');
                typing = false;
            } else {
                //TODO check username unique
                setUsername();
                $usernameInput.val('')
            }
            if (roomState) {
                roomState = false;
                setRoomName();
                $roomnameInput.val('')
            }
            if (friendState) {
                friendState = false;
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
        connected = true;
        // Display the welcome message
        const message = "Welcome to Chat " + data.roomName;
        log(message, {
            prepend: true
        });
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
        socket.emit('user left', data);
        $('.messages > li').remove();
        log(data.roomName + ' created successfully')
    });

    socket.on('invite user', function (data) {
        logWithStyle(' invite you to join room ', data)
    });
    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', function (data) {
        if (data.roomName) {
            log(data.username + ' joined to room: ' + data.roomName);
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
        if (username) {
            socket.emit('add user', username);
        }
    });

    socket.on('reconnect_error', function () {
        log('attempt to reconnect has failed');
    });

});