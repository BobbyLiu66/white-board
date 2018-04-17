'use strict';

$(function () {
    const socket = window.socket;
    let canvas = window.canvas;
    let context = window.context;
    let clear = document.getElementById('clear');

    let current = {};
    let drawing = false;
    let $hidden = $('#hidden');

    $('#whiteboard').hide();
    $('.controls').hide();
    $hidden.prop('value', 'display');
    $hidden.html('Display Whiteboard');
    $('.login.page .form').css("width", "100%");
    $('.page').css("width", "100%");
    $('.chatRoom').css("width", "100%");

    //Hidden display canvas
    $hidden.click(function () {
        if ($hidden.val() === 'hide') {
            $('#whiteboard').hide();
            $('.controls').hide();
            $hidden.prop('value', 'display');
            $hidden.html('Display Whiteboard');
            $('.login.page .form').css("width", "100%");
            $('.page').css("width", "100%");
            $('.chatRoom').css("width", "100%")
        }
        else if ($hidden.val() === 'display') {
            $('#whiteboard').show();
            $('.controls').show();
            $hidden.prop('value', 'hide');
            $hidden.html('Hidden Whiteboard');
            $('.login.page .form').css("width", "22%");
            $('.page').css("width", "22%");
            $('.chatRoom').css("width", "22%")
        }
    });

    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('mouseup', onMouseUp, false);
    canvas.addEventListener('mouseout', onMouseUp, false);
    canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

    clear.addEventListener('click', clearArea, false);

    window.addEventListener('resize', onResize, false);
    onResize();


    //TODO other users color
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
            strokeStyle:strokeStyle,
            lineWidth:lineWidth,
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

    // make the canvas fill its parent
    function onResize() {
        canvas.width = window.innerWidth * 0.75;
        canvas.height = window.innerHeight;
    }

    function clearArea() {
        // Use the identity matrix while clearing the canvas
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }

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
    })
});