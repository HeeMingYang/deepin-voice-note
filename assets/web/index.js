//C++ 调用js接口
//信号绑定
// initData(const QString& jsonData); 初始化，参数为json字符串
// void setHtml(const QString& html); 初始化，设置html
// insertVoiceItem(const QString &jsonData);　插入语音，参数为json字符串

//callback回调
// const QString getHtml();获取整个html
// const QString getAllNote();获取所有语音列表的Json
//

// 注册右键点击事件
$('body').on('contextmenu', rightClick)
// 注册内容改变事件
$('#summernote').on('summernote.change', changeContent);

// 初始化渲染模板
var h5Tpl = `
    <div class="li voiceBox" contenteditable="false" jsonKey="{{jsonValue}}">
        <div class='voiceInfoBox'>
            <div class="demo" >              
                <div class="voicebtn play"></div>
                <div class="lf">
                    <div class="title">{{title}}</div>
                    <div class="minute padtop">{{createTime}}</div>
                </div>
                <div class="lr">
                    <div class="icon">
                        <div class="wifi-symbol">
                            <div class="wifi-circle"></div>
                        </div>
                    </div>
                    <div class="time padtop">{{transSize}}</div>
                </div>
            </div>
            <div class="translate">
            </div>
        </div>
    </div>
    {{#if text}}
    <p>{{text}}</p>
    {{/if}}
    `;
// 语音插入模板
var nodeTpl = `
        <div class='voiceInfoBox'>
            <div class="demo"  >
                <div class="voicebtn play"></div>
                <div class="lf">
                    <div class="title">{{title}}</div>
                    <div class="minute padtop">{{createTime}}</div>
                </div>
                <div class="lr">
                    <div class="icon">
                        <div class="wifi-symbol">
                            <div class="wifi-circle"></div>
                        </div>
                    </div>
                    <div class="time padtop">{{transSize}}</div>
                </div>
            </div>
            <div class="translate">
            </div>
        </div>`;

var formatHtml = ''
var pasteData = "";
var webobj;    //js与qt通信对象
var activeVoice = null;  //当前正操作的语音对象
var activeTransVoice = null;  //执行语音转文字对象
var bTransVoiceIsReady = true;  //语音转文字是否准备好
var initFinish = false;
var voiceIntervalObj;    //语音播放动画定时器对象
var isVoicePaste = false
var isShowAir = true
var nowClickVoice = null
var global_activeColor = ''
var global_disableColor = ''
var global_theme = 1
var scrollHide = null  //滚动条隐藏定时器

var tooltipContent = {
    fontsize: '字号',
    forecolor: '字体颜色',
    backcolor: '背景色',
    bold: '加粗',
    italic: '斜体',
    underline: '下划线',
    strikethrough: '删除线',
    ul: '无序列表',
    ol: '有序列表',
    more: '更多颜色',
    transparent: '透明',
    recentlyUsed: '最近使用'
}

// 初始化summernote
$('#summernote').summernote({
    focus: true,
    disableDragAndDrop: true,
    lang: 'zh-CN',
    popover: {
        air: [
            ['fontsize', ['fontsize']],
            ['forecolor', ['forecolor']],
            ['backcolor', ['backcolor']],
            ['bold', ['bold']],
            ['italic', ['italic']],
            ['underline', ['underline']],
            ['strikethrough', ['strikethrough']],
            ['line'],
            ['ul', ['ul']],
            ['ol', ['ol']],
        ],
    },
    airMode: true,

});

// 监听窗口大小变化
$(window).resize(function () {
    $('.note-editable').css('min-height', $(window).height())
});



/**
 * 通知后台存储页面内容
 * @date 2021-08-19
 * @param {any} we
 * @param {any} contents
 * @param {any} $editable
 * @returns {any}
 */
function changeContent(we, contents, $editable) {
    if ($('.note-editable').html() == '') {
        $('.note-editable').html('<p><br></p>')
    }
    if (webobj && initFinish) {
        if (!$('.note-air-popover').is(':hidden')) {
            if (getSelectedRange().innerHTML == "") {
                $('#summernote').summernote('airPopover.hide')
            }
        }
        webobj.jsCallTxtChange();
    }
}

// 判断编辑区是否为空
function isNoteNull() {
    return $('.note-editable').html() === '<p><br></p>'
}

//点击选中录音
$('body').on('click', '.li', function (e) {
    e.stopPropagation();
    $('.li').removeClass('active');
    setSelectRange(this)
    isShowAir = false
    $(this).addClass('active');
})

$('body').on('click', '.translate', function (e) {
    // 阻止冒泡
    e.stopPropagation();
})

/**
 * 获取选区
 * @date 2021-09-08
 * @returns {any} div
 */
function getSelectedRange() {
    var selectionObj = window.getSelection();
    var rangeObj = selectionObj.getRangeAt(0);
    var docFragment = rangeObj.cloneContents();
    var testDiv = document.createElement("div");
    testDiv.appendChild(docFragment)
    return testDiv
}

/**
 * 设置光标位置
 * @date 2021-09-09
 * @param {any} element 元素
 * @param {any} pos 起始偏移量
 * @returns {any}
 */
function setFocus(element, pos) {
    var range, selection;
    range = document.createRange();
    range.selectNodeContents(element);
    if (element.innerHTML.length > 0) {
        range.setStart(element.childNodes[0], pos);
    }
    range.collapse(true);       //设置选中区域为一个点
    selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

/**
 * 设置选区
 * @date 2021-09-10
 * @param {any} dom
 * @returns {any}
 */
function setSelectRange(dom) {
    var sel = window.getSelection();
    sel.removeAllRanges();
    var range = document.createRange();
    range.selectNode(dom);
    // range.collapse(true);
    if (sel.anchorOffset == 0) {
        sel.addRange(range);
    };

}

/**
 * 移除选区
 * @date 2021-09-10
 * @param {any} dom
 * @returns {any}
 */
function removeSelectRange(dom) {
    var sel = window.getSelection();
    var range = document.createRange();
    range.selectNode(dom);
    sel.removeRange(range)
}

// 取消选中样式
$('body').on('click', function () {
    $('.li').removeClass('active');
})

// 语音复制
document.addEventListener('copy', copyVoice);
// 语音剪切
document.addEventListener('cut', copyVoice);

// 语音复制功能
function copyVoice(event) {
    isVoicePaste = false
    var selectionObj = window.getSelection();
    var rangeObj = selectionObj.getRangeAt(0);
    var docFragment = rangeObj.cloneContents();
    var testDiv = document.createElement("div");
    // 判断是否语音复制
    if ($(docFragment).find('.voiceBox').length != 0) {
        $(docFragment).find('.translate').html('')
        $(docFragment).find('.voiceBox').removeClass('active')

        $(docFragment).find('.voicebtn').removeClass('pause').addClass('play');
        $(docFragment).find('.voicebtn').removeClass('now');
        $(docFragment).find('.wifi-circle').removeClass('first').removeClass('second').removeClass('third').removeClass('four');
        if (event.type == 'cut') {
            rangeObj.deleteContents()
            let p = document.createElement('p');
            p.innerHTML = '<br>'
            rangeObj.insertNode(p)
            // 设置焦点
            setFocus(p, 0)
            // 记录之前数据
            $('#summernote').summernote('editor.recordUndo')
            // 主动触发change事件
            changeContent()
        }
        event.preventDefault()
        isVoicePaste = true
    }
    testDiv.appendChild(docFragment);
    formatHtml = testDiv.innerHTML;
    if ($(testDiv).children().length == 1 && $(testDiv).find('.voiceBox').length != 0) {
        formatHtml = '<p><br></p>' + formatHtml
    }
    pasteData = window.getSelection().toString();
}

// 剪切板内容变化
function shearPlateChange() {
    isVoicePaste = false
}

// 粘贴
document.addEventListener('paste', function (event) {
    if (formatHtml != "" && isVoicePaste) {
        document.execCommand('insertHTML', false, formatHtml + "<p><br></p>");
        event.preventDefault()
    }
    setFocusScroll()
    removeNullP()
});

// 页面滚动到光标位置
function setFocusScroll() {
    let focusY = getCursortPosition(document.querySelector('.note-editable'))
    let viewY = $(window).height() + $(document).scrollTop()
    if (focusY > viewY) {
        let sel = document.getSelection();
        sel.focusNode.scrollIntoView(false)
    }
}

/**
 * 判断选区类别
 * @date 2021-09-06
 * @returns {object} 0图片 1语音 2文本
 */
function isRangeVoice() {
    let selectedRange = {
        flag: null,
        info: ''
    }
    var testDiv = getSelectedRange();
    let childrenLength = $(testDiv).children().length
    let voiceLength = $(testDiv).find('.voiceBox').length
    let imgLength = $(testDiv).find('img').length

    if (voiceLength == childrenLength && childrenLength != 0) {
        selectedRange.flag = 1
        selectedRange.info = $(testDiv).find('.voiceBox:first').attr('jsonKey')
    } else if (imgLength == childrenLength && childrenLength == 1) {
        selectedRange.flag = 0
        selectedRange.info = $(testDiv).find('img').attr('src')
    } else {
        selectedRange.flag = 2
    }
    return selectedRange
}

//播放
$('body').on('click', '.voicebtn', function (e) {
    // e.stopPropagation();
    var curVoice = $(this).parents('.li:first');
    var jsonString = curVoice.attr('jsonKey');
    var bIsSame = $(this).hasClass('now');
    var curBtn = $(this);
    $('.voicebtn').removeClass('now');
    activeVoice = curBtn;
    activeVoice.addClass('now');

    webobj.jsCallPlayVoice(jsonString, bIsSame, function (state) {
        //TODO 录音错误处理
    });
})

//获取整个处理后Html串,去除所有标签中临时状态
function getHtml() {
    var $cloneCode = $('.note-editable').clone();
    $cloneCode.find('.li').removeClass('active');
    $cloneCode.find('.voicebtn').removeClass('pause').addClass('play');
    $cloneCode.find('.voicebtn').removeClass('now');
    $cloneCode.find('.wifi-circle').removeClass('first').removeClass('second').removeClass('third').removeClass('four');
    $cloneCode.find('.translate').html("")
    return $cloneCode[0].innerHTML;
}

//获取当前所有的语音列表
function getAllNote() {
    var jsonObj = {};
    var jsonArray = [];
    var jsonString;
    $('.li').each(function () {
        jsonString = $(this).attr('jsonKey');
        jsonArray[jsonArray.length] = JSON.parse(jsonString);
    })
    jsonObj.noteDatas = jsonArray;
    var retJson = JSON.stringify(jsonObj);
    return retJson;
}

//获取当前选中录音json串
function getActiveNote() {
    var retJson = '';
    if ($('.active').length > 0) {
        retJson = $('.active').attr('jsonKey');
    }
    return retJson;
}

new QWebChannel(qt.webChannelTransport,
    function (channel) {
        webobj = channel.objects.webobj;
        //所有的c++ 调用js的接口都需要在此绑定格式，webobj.c++函数名（jscontent.cpp查看.connect(js处理函数)
        //例如 webobj.c++fun.connect(jsfun)
        webobj.callJsInitData.connect(initData);
        webobj.callJsInsertVoice.connect(insertVoiceItem);
        webobj.callJsSetPlayStatus.connect(toggleState);
        webobj.callJsSetHtml.connect(setHtml);
        webobj.callJsSetVoiceText.connect(setVoiceText);
        webobj.callJsInsertImages.connect(insertImg);
        webobj.callJsSetTheme.connect(changeColor);
        webobj.calllJsShowEditToolbar.connect(showRightMenu);
        webobj.callJsHideEditToolbar.connect(hideRightMenu);
        webobj.callJsClipboardDataChanged.connect(shearPlateChange);
        webobj.callJsSetVoicePlayBtnEnable.connect(playButColor);

        //通知QT层完成通信绑定
        webobj.jsCallChannleFinish();
    }
)

/**
 * 获取光标Y轴位置
 * @date 2021-09-08
 * @param {any} element 可编辑dom
 * @returns {number} Y轴位置 
 */
function getCursortPosition(element) {
    var caretOffset = 0;
    var doc = element.ownerDocument || element.document;
    var win = doc.defaultView || doc.parentWindow;
    var sel = win.getSelection();
    if (sel.rangeCount > 0) {
        var range = win.getSelection().getRangeAt(0);
        var preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);  //重置选中区域的结束位置
        caretOffset = preCaretRange.toString().length;
    }
    return caretOffset;
}

//初始化数据 
function initData(text) {
    initFinish = false;
    var arr = JSON.parse(text);
    var html = '';
    var voiceHtml;
    var txtHtml = '';
    arr.noteDatas.forEach((item, index) => {
        //false: txt
        if (item.type == 1) {
            if (item.text == '') {
                txtHtml = '<p><br></p>';
            }
            else {
                let textArr = item.text.split('\n')
                textArr.forEach(ite => {
                    txtHtml = txtHtml + '<p>' + ite + '</p>';
                })
            }
            html += txtHtml;
        }
        //true: voice
        else {
            voiceHtml = transHtml(item, false);
            html += voiceHtml;
        }
    })

    $('#summernote').summernote('code', html);
    // 搜索功能
    webobj.jsCallSetDataFinsh();
    initFinish = true;
    $('#summernote').summernote('editor.resetRecord')
}

/**
 * 播放按钮置灰
 * @date 2021-09-03
 * @param {boolean} status false禁用 true启用
 * @returns {any}
 */
function playButColor(status) {
    if (!status) {
        setVoiceButColor(global_disableColor)

    } else {
        setVoiceButColor(global_activeColor)
    }
}

//录音插入数据
function insertVoiceItem(text) {
    // 记录插入前数据
    $('#summernote').summernote('editor.recordUndo')

    var arr = JSON.parse(text);
    var voiceHtml = transHtml(arr, true);
    var oA = document.createElement('div');
    oA.className = 'li voiceBox';
    oA.contentEditable = false;
    oA.setAttribute('jsonKey', text);
    oA.innerHTML = voiceHtml;

    var tmpNode = document.createElement("div");
    tmpNode.appendChild(oA.cloneNode(true));
    var str = '<p><br></p>' + tmpNode.innerHTML + '<p><br></p>';

    document.execCommand('insertHTML', false, str);
    $('#summernote').summernote('editor.recordUndo')

    removeNullP()
    setFocusScroll()
}

/**
 * 移除无内容p标签
 * @date 2021-08-19
 * @returns {any}
 */
function removeNullP() {
    $('p').each((index, item) => {
        if (item.innerHTML === '') {
            $(item).remove();
        }
    })

}

/**
 * 切换播放状态
 * @date 2021-08-19
 * @param {string} state 0,播放中，1暂停中，2.结束播放
 * @returns {any}
 */
function toggleState(state) {
    if (state == '0') {
        $('.voicebtn').removeClass('pause').addClass('play');
        activeVoice.removeClass('play').addClass('pause');
        voicePlay(true);
    } else if (state == '1') {
        activeVoice.removeClass('pause').addClass('play');
        voicePlay(false);
    }
    else {
        activeVoice.removeClass('pause').addClass('play');
        activeVoice.removeClass('now');
        activeVoice = null;
        voicePlay(false);
    }
}

/**
 * 设置整个html内容
 * @date 2021-08-19
 * @param {string} html
 * @returns {any}
 */
function setHtml(html) {
    if (html == '<p></p>') {
        html = '<p><br></p>'
    }
    initFinish = false;
    $('#summernote').summernote('code', html);
    initFinish = true;
    // 搜索功能
    webobj.jsCallSetDataFinsh();
    resetScroll()
    $('#summernote').summernote('editor.resetRecord')
}

//设置录音转文字内容 flag: 0: 转换过程中 提示性文本（＂正在转文字中＂)１:结果 文本,空代表转失败了
function setVoiceText(text, flag) {
    if (activeTransVoice) {
        if (flag) {
            activeTransVoice.find('.translate').html('');
            if (text) {
                activeTransVoice.after('<p>' + text + '</p>');
                webobj.jsCallTxtChange();
            }
            //将转文字文本写到json属性里
            var jsonValue = activeTransVoice.attr('jsonKey');
            var jsonObj = JSON.parse(jsonValue);
            jsonObj.text = text;
            activeTransVoice.attr('jsonKey', JSON.stringify(jsonObj));

            webobj.jsCallTxtChange();
            activeTransVoice = null;
            bTransVoiceIsReady = true;

            // 移除选区
            var sel = window.getSelection();
            var range = sel.getRangeAt(0);
            sel.removeRange(range)
            $('.li').removeClass('active');
        }
        else {
            activeTransVoice.find('.translate').html('<div class="noselect">' + text + '</div>');
            bTransVoiceIsReady = false;
        }

    }
}

//json串拼接成对应html串 flag==》》 false: h5串  true：node串
function transHtml(json, flag) {
    let createTime = json.createTime.slice(0, 16)
    createTime = createTime.replace(/-/g, `/`)
    json.createTime = createTime
    //将json内容当其属性与标签绑定
    var strJson = JSON.stringify(json);
    json.jsonValue = strJson;
    var template;
    if (flag) {
        template = Handlebars.compile(nodeTpl);
    }
    else {
        template = Handlebars.compile(h5Tpl);
    }
    var retHtml = template(json);
    return retHtml;
}

//设置summerNote编辑状态 
function enableSummerNote() {
    if (activeVoice || (activeTransVoice && !bTransVoiceIsReady)) {
        $('#summernote').summernote('disable');
    }
    else {
        $('#summernote').summernote('enable');
    }
}

// 录音播放控制， bIsPaly=ture 表示播放。
function voicePlay(bIsPaly) {
    clearInterval(voiceIntervalObj);
    $('.wifi-circle').removeClass('first').removeClass('second').removeClass('third').removeClass('four');

    if (bIsPaly) {
        var index = 0;
        voiceIntervalObj = setInterval(function () {
            if (activeVoice && activeVoice.hasClass('pause')) {
                var voiceObj = activeVoice.parent().find('.wifi-circle');
                index++;
                switch (index) {
                    case 1:
                        voiceObj.removeClass('four').addClass('first');
                        break;
                    case 2:
                        voiceObj.removeClass('first').addClass('second');
                        break;
                    case 3:
                        voiceObj.removeClass('second').addClass('third');
                        break;
                    case 4:
                        voiceObj.removeClass('third').addClass('four');
                        index = 0;
                        break;
                }
            }
        }, 400);
    }
}

/**
 * 右键功能
 * @date 2021-08-19
 * @param {any} e
 * @returns {any} 
 */
function rightClick(e) {
    // isShowAir = false;
    if (e.which == 3) {
        $('.li').removeClass('active');
    }
    if (e.target.tagName == 'IMG') {
        let img = e.target
        // img.focus();
        $('.note-editable ').blur()
        setSelectRange(img)
    } else if ($(e.target).hasClass('demo') || $(e.target).parents('.demo').length != 0) {
        $(e.target).parents('.li').addClass('active');
        // 当前没有语音在转文字时， 才可以转文字
        if (bTransVoiceIsReady) {
            activeTransVoice = $(e.target).parents('.li:first');
        }
        $('#summernote').summernote('airPopover.hide')
        setSelectRange($(e.target).parents('.voiceBox')[0])
    }
    let info = isRangeVoice()
    webobj.jsCallPopupMenu(info.flag, info.info);
    // 阻止默认右键事件
    // e.preventDefault()
}


/**
 * 设置活动色
 * @date 2021-09-06
 * @param {any} color
 * @returns {any}
 */
function setVoiceButColor(color) {
    $("#style").html(`
    
    .voiceBox .voicebtn {
        background-color:${color}
    } 
    .btn-default.active i {
        color:${color}!important
    }
    .btn-default:active {
        color:${color}!important
    }
    .btn-default i:active {
        color:${color}!important
    }
    `)
}

/**
 * 深色浅色变换
 * @date 2021-08-19
 * @param {any} flag 1浅色 2深色
 * @returns {any}
 */
function changeColor(flag, activeColor, disableColor) {
    global_theme = flag
    global_activeColor = activeColor
    global_disableColor = disableColor

    setVoiceButColor(global_activeColor)

    $('.dropdown-fontsize>li>a').hover(function (e) {
        $(this).css('background-color', activeColor);
        // $(this).css('color', '#fff');

    }, function () {
        $('.dropdown-fontsize>li>a').css('background-color', 'transparent');
        if (flag == 1) {
            $('.dropdown-fontsize>li>a').css('color', "black");
        } else {
            $('.dropdown-fontsize>li>a').css('color', "rgba(197,207,224,1)");
        }
    })
    if (flag == 1) {
        $('#dark').remove()
        $('.dropdown-fontsize>li>a').css('color', "black");
    } else {
        $("head").append("<link>");
        var css = $("head").children(":last");
        css.attr({
            id: 'dark',
            rel: "stylesheet",
            type: "text/css",
            href: "./css/dark.css"
        });
    }

}

/**
 * 插入图片
 * @date 2021-08-19
 * @param {any} urlStr 图片地址list
 * @returns {any}
 */
function insertImg(urlStr) {
    urlStr.forEach((item, index) => {
        $("#summernote").summernote('insertImage', item, 'img');
    })

}

// 禁用ctrl+v
document.onkeydown = function (event) {
    if (event.ctrlKey && window.event.keyCode == 86) {
        webobj.jsCallPaste()
        return false;
    }
}

// ctrl+b 添加记事本
document.onkeyup = function (event) {
    if (event.ctrlKey && window.event.keyCode == 66) {
        webobj.jsCallCreateNote()

    }
}

// 图片双击预览
$('body').on('dblclick', 'img', function (e) {
    e.stopPropagation()
    e.preventDefault()
    let imgUrl = $(e.target).attr('src')
    webobj.jsCallViewPicture(imgUrl)
})

// 图片单击选中
$('body').on('click', 'img', function (e) {
    let img = e.target
    setSelectRange(img)
})

/**
 * 右键显示悬浮工具栏
 * @date 2021-09-03
 * @param {any} x 坐标
 * @param {any} y 坐标
 * @returns {any}
 */
function showRightMenu(x, y) {
    $('#summernote').summernote('airPopover.rightUpdate', x, y)
}

// 右键隐藏悬浮工具栏
function hideRightMenu() {
    $('#summernote').summernote('airPopover.hide')
}

// 重置滚动条
function resetScroll() {
    if ($(document).scrollTop() != 0) {
        $(document).scrollTop(0)
    }
}

// 监听滚动事件
$(document).scroll(function () {
    if (scrollHide) {
        clearTimeout(scrollHide)
        $('#scrollStyle').html(`
        body::-webkit-scrollbar-thumb {
        background-color:${global_theme == 1 ? "rgba(0, 0, 0, 0.30)" : "rgba(255, 255, 255, 0.20)"} ;
        }`
        )
    }

    scrollHide = setTimeout(() => {
        $('#scrollStyle').html('')
    }, 1500);
});

/**
 * 改变光标颜色
 * @date 2021-09-09
 * @param {int} flag 1 透明 2 自动
 * @returns {any}
 */
function setFocusColor(flag) {
    $('.note-editable').css('caret-color', flag == 1 ? 'transparent' : 'auto')
}