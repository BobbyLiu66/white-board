'use strict';

$(function () {
    const socket = io();
    let canvas = document.getElementById('canvas');
    let context = canvas.getContext('2d');

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
    let current = {};
    let drawing = false;

    let $window = $(window);

    let $usernameInput = $('#username'); // Input for username
    let $passwordInput = $('#password');
    let $roomNameInput = $('#roomName');
    let $inviteFriend = $('#friendName');
    let $messages = $('.messages'); // Messages area
    let $inputMessage = $('.inputMessage'); // Input message input box
    let $currentInput = $usernameInput.focus();

    let $loginPage = $('.login.page'); // The login page
    let $chatPage = $('.chat.page'); // The chatroom page

    let $navControl = $('.whiteboardControllers.control');
    let $loginMsg = $('h3.title');
    let $hiddenBtn = $('.hideDisplay button');

    //TODO
    $roomNameInput.hide();
    $inviteFriend.hide();
    $navControl.hide();
    $('#canvas').hide();
    onResize();

    if (window.sessionStorage.username !== undefined) {
        $loginPage.hide();
        $chatPage.fadeIn("slow");
        $loginPage.off('click');
        $currentInput = $inputMessage.focus();
        connected = true;
        socket.emit('add user', window.sessionStorage.username, window.sessionStorage.roomName)
    }

    //events
    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('mouseup', onMouseUp, false);
    canvas.addEventListener('mouseout', onMouseUp, false);
    canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);
    window.addEventListener('resize', onResize, false);
    // Click events
    $(".clearBoard").click(() => {
        socket.emit('clear area');
        $(this).attr("disabled", true);
        setTimeout(() => {
            $(this).attr("disabled", false)
        }, 6 * 1000)
    });

    //hidden display canvas
    $hiddenBtn.click(() => {
        if ($hiddenBtn.val() === "hide") {
            $('#canvas').hide();
            $navControl.hide();
            $hiddenBtn.prop("value", "show");
            $hiddenBtn.html("Show Board");
            $(".left").css({"width": "0"});
            $(".right").css({"width": "100%"});
            $loginPage.css({"width": "100%"});
            $(".login.page .form").css({"width": "100%"});
            $chatPage.css({"width": "100%"});
            $inputMessage.css({"width": "100%", "left": "0"});
            $(".pages").css({"width": "100%"})
        }
        else if ($hiddenBtn.val() === "show") {
            $('#canvas').show();
            $navControl.show();
            $hiddenBtn.prop("value", "hide");
            $hiddenBtn.html("Hide Board");
            $(".left").css({"width": "75%"});
            $(".right").css({"width": "25%"});
            $loginPage.css({"width": "25%"});
            $(".login.page .form").css({"width": "25%"});
            $chatPage.css({"width": "25%"});
            $inputMessage.css({"width": "25%", "left": "75%"});
            $(".pages").css({"width": "25%"})
        }
    });


    //clear message
    $('.clearChat').click(() => {
        $('.messages > li').remove()
    });

    //create room
    $('.newRoom').click(() => {
        $navControl.hide();
        $loginMsg.text('Input Room Name');
        $usernameInput.hide();
        $passwordInput.hide();
        $inviteFriend.hide();
        $roomNameInput.fadeIn("slow");
        $chatPage.fadeOut();
        $loginPage.fadeIn("slow");
        $roomNameInput.focus();
        roomState = true
    });

    //invite friend
    $('.inviteFriend').click(function () {
        $navControl.hide();
        $loginMsg.text("Input Your Friend's Name");
        $usernameInput.hide();
        $passwordInput.hide();
        $roomNameInput.hide();
        $inviteFriend.fadeIn("slow");
        $chatPage.fadeOut();
        $loginPage.fadeIn("slow");
        $inviteFriend.focus();
        friendState = true
    });

    // Focus input when clicking anywhere on login page
    $loginPage.click(function () {
        $currentInput.focus();
    });

    // Focus input when clicking on the message input's border
    $inputMessage.click(function () {
        $inputMessage.focus();
    });

    function drawLine(x0, y0, x1, y1, emit, strokeStyle, lineWidth) {
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = strokeStyle;
        context.lineWidth = lineWidth;
        context.stroke();
        context.closePath();
        if (!emit) {
            return;
        }
        let w = canvas.width;
        let h = canvas.height;
        let image = canvas.toDataURL();

        socket.emit('drawing', {
            x0: x0 / w,
            y0: y0 / h,
            x1: x1 / w,
            y1: y1 / h,
            image: image,
            strokeStyle: strokeStyle,
            lineWidth: lineWidth,
        });
    }

    function onMouseDown(e) {
        drawing = true;
        current.x = e.clientX;
        current.y = e.clientY;
    }

    function onMouseUp(e) {
        if (!drawing) {
            return;
        }
        drawing = false;
        let strokeStyle = $('#selColor').val();
        let lineWidth = $('#selWidth').val();
        drawLine(current.x, current.y, e.clientX, e.clientY, true, strokeStyle, lineWidth);
    }

    function onMouseMove(e) {
        if (!drawing) {
            return;
        }
        let strokeStyle = $('#selColor').val();
        let lineWidth = $('#selWidth').val();
        drawLine(current.x, current.y, e.clientX, e.clientY, true, strokeStyle, lineWidth);
        current.x = e.clientX;
        current.y = e.clientY;
    }

    // limit the number of events per second
    function throttle(callback, delay) {
        let previousCall = new Date().getTime();
        return function () {
            let time = new Date().getTime();

            if ((time - previousCall) >= delay) {
                previousCall = time;
                callback.apply(null, arguments);
            }
        };
    }

    function onDrawingEvent(data) {
        let w = canvas.width;
        let h = canvas.height;
        drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, false, data.strokeStyle, data.lineWidth);
    }


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
        let roomID = cleanInput($roomNameInput.val().trim());
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
            $roomNameInput.val('').focus();
        }
    }

    // Send invite message to a person
    function sendInviteMessage() {
        let friendName = cleanInput($inviteFriend.val().trim());
        if (friendName === window.sessionStorage.username) {
            alert('You cannot invite yourself');
            $inviteFriend.val('').focus();
        }
        else if (friendName) {
            socket.emit('invite user', {inviteName: friendName, username: window.sessionStorage.username});
        }
        else {
            alert('You need to fill your friend name');
            $inviteFriend.val('').focus();
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

    // Log a message about invite friend
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

    // Log a message about clear whiteboard
    function logAboutClear(message, options) {
        let state = "default";
        let $usernameDiv = $('<span/>')
            .text(options.sponsor)
            .css('color', getUsernameColor(options.sponsor));
        let $accept = $('<button class="acceptOrDecline"/>').text("accept")
            .click(function () {
                state = "accept";
                socket.emit('accept clear', {
                    sponsor: options.sponsor
                });
                $(this).parent().children('button').attr("disabled", true)
            });
        let $decline = $('<button class="acceptOrDecline"/>').text("decline")
            .click(function () {
                state = "decline";
                socket.emit('decline clear', {
                    sponsor: options.sponsor
                });
                $(this).parent().children('button').attr("disabled", true)
            });

        // if no response after 1 minute click decline automatically
        setTimeout(function () {
            if (state === "default") {
                $decline.click()
            }
        }, 6 * 1000);

        let $messageDiv = $('<li class="log"/>')
            .append($usernameDiv, message + " ", $accept, " or ", $decline);
        addMessageElement($messageDiv);
    }

    //TODO split broadcast to two part
    // Adds the visual chat message to the message list
    function addChatMessage(data, options, oneself) {
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
            .addClass(typingClass);
        if (oneself) {
            $messageDiv.append($messageBodyDiv, $usernameDiv)
        }
        else {
            $messageDiv.append($usernameDiv, $messageBodyDiv);
        }

        addMessageElement($messageDiv, options);
    }

    // Load chat history message
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

    // Gets the color of a username through this hash function
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
                $roomNameInput.val('')
            }
            if (friendState) {
                sendInviteMessage();
                $inviteFriend.val('')
            }
        }

        // click esc go back
        if (event.which === 27) {
            $loginPage.hide();
            $navControl.fadeIn("slow");
            $chatPage.fadeIn("slow");
            $loginPage.off('click');
            $currentInput = $inputMessage.focus();
        }
    });

    $inputMessage.on('input', function () {
        updateTyping();
    });


    // Socket events

    // Whenever the server emits 'login', log the login message
    socket.on('login', function (data) {
        $loginPage.fadeOut();
        $chatPage.fadeIn("slow");
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
        $usernameInput.val('').focus();
        $passwordInput.val('');
    });

    socket.on('create room fail', function (data) {
        alert(data.err);
        $roomNameInput.val('');
        $usernameInput.focus()
    });

    socket.on('invite fail', function (data) {
        alert(data.err);
        $inviteFriend.val('').focus();
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
    socket.on('clear screen', function () {
        $('.messages > li').remove();
    });

    socket.on('create room', function (data) {
        window.sessionStorage.roomName = data.roomName;
        $loginPage.fadeOut();
        $chatPage.fadeIn("slow");
        $loginPage.off('click');
        socket.emit('user left', data);
        roomState = false;
        log(data.roomName + " " + data.message)
    });

    socket.on('invite user', function (data) {
        inviteFriend = data.inviteName;
        $loginPage.fadeOut();
        $chatPage.fadeIn("slow");
        $loginPage.off('click');
        friendState = false;
        logWithStyle(' invite you to join room ', data, 'invite')
    });


    socket.on('invite success', function (data) {
        inviteFriend = data.inviteName;
        $loginPage.fadeOut();
        $chatPage.fadeIn("slow");
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

    //
    socket.on('disconnect', function () {
        log('you have been disconnected');
    });

    socket.on('reconnect', function () {
        log('you have been reconnected');
        if (window.sessionStorage.username) {
            socket.emit('add user', window.sessionStorage.username, window.sessionStorage.roomName);
        }
    });

    socket.on('reconnect_error', function () {
        log('attempt to reconnect has failed');
    });

    //whiteboard
    socket.on('clear area', function (data) {
        logAboutClear(' want to clear the area', data)
    });

    socket.on('clear success', function () {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        log('area clear success')
    });

    socket.on('clear fail', function () {
        log('area clear fail')
    });

    socket.on('accept clear', function (data) {
        log(data.username + ' agree clear')
    });

    socket.on('decline clear', function (data) {
        log(data.username + ' decline clear')
    });

    socket.on('drawing', function (data) {
        onDrawingEvent(data)
    });

    socket.on('load image', function (data) {
        let image = new Image();
        image.onload = function () {
            context.drawImage(image, 0, 0);
        };
        if (data.image) {
            image.src = data.image;
        }
    });

    socket.on('clear whiteboard screen',function () {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    });


    function onResize() {
        canvas.width = window.innerWidth * 0.745;
        canvas.height = window.innerHeight;
    }
});