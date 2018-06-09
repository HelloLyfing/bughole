var Base64 = {_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9+/=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/rn/g,"n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}

var Utils = {
    encodedHtmlEntity: function  (rawStr) {
        return rawStr.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
            return '&#'+i.charCodeAt(0)+';';
        });
    },

    setCookie: function (cname, cvalue) {
        cname = cname;
        cvalue = Utils.base64.encode(cvalue);
        document.cookie = cname + '=' + cvalue + ';';
    },

    getCookie: function (cname) {
        cname = cname;
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var tmpIdx = ca[i].indexOf('=');
            if (tmpIdx > 0 && ca[i].substr(0, tmpIdx).trim() === cname) {
                return Utils.base64.decode(ca[i].substr(tmpIdx + 1).trim());
            }
        }
        return '';
    },

    base64: Base64,

    showLoading: function () {
        $('img[name=loading]').removeClass('hide');
    },

    hideLoading: function () {
        $('img[name=loading]').addClass('hide');
    },

    danderMsg: function (msg) {
        // http://yjseo29.github.io/notify
        toastr.warning(msg);
    },

    infoMsg: function (msg) {
        toastr.info(msg);
    },

    gmtNow: function () {
        return Date.now() / 1000;
    }

};

function sendCmd(cmdType, cmdContent, extraData) {
    if (!cmdContent) {
        cmdContent = '';
    }

    // remove cookie: XDEBUG_SESSION
    document.cookie = 'XDEBUG_SESSION=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = document.cookie.replace(/XDEBUG_SESSION=[^;]+/, '');

    var cmdInfo = {
        'type': cmdType,
        'content': cmdContent,
    };

    Utils.showLoading();
    $.post('/cmd_transfer.php', {'cmd_info': JSON.stringify(cmdInfo)}, function (resp) {
        Utils.hideLoading();
        console.log('sendCmd:', cmdInfo, 'getResponse:', resp);

        if (extraData && extraData.skipCallHandler) {
            console.log('skip call handler');
            return;
        }

        var resultHandler = handlerMap[cmdType];
        if (resultHandler) {
            resultHandler(resp, extraData);
        } else {
            Utils.danderMsg('FYI：unkonwn handler——' + cmdType);
        }
    });
}

function handleInitConn(result) {
    if (!result.success) {
        Utils.danderMsg(result.message ? result.message : '建立连接失败！');
        return;
    }

    Utils.infoMsg(result.message);

    setTimeout( function() {
        $('.J_checkConn').removeClass('hide');
    }, 50);

    // 定期查询是否已连接成功
    timeIntervalMap.checkConnInterval = Utils.gmtNow() + maxWaitConnTime;
    sendCmd(cmdTypes.typeCheckConn);
}

function handleCheckConn(result) {
    if (!result.success) {
        if (Utils.gmtNow() > timeIntervalMap.checkConnInterval) {
            $('.J_checkConn').addClass('hide');
            Utils.danderMsg('连接超时，请重新建立连接');
        } else {
            Utils.showLoading();
            setTimeout( function() {
                sendCmd(cmdTypes.typeCheckConn);
            }, 300);
        }
        return;
    }

    Utils.infoMsg('连接成功，正在进行初始化设置...');

    Utils.hideLoading();
    $('.J_checkConn').addClass('hide');

    // Xdebug feature set
    sendCmd(cmdTypes.typeFeatureSet, {'max_children': 200, 'max_depth': 1, 'max_data': 0});
    // 注册断点
    setTimeout( function() {
        sendCmd(cmdTypes.typeAddBreakPoint, getBptList(), {'autoStartRun': 1});
        window.autoRefreshBptList = 1;
    }, 300);
}

function handleFeatureSet(result) {
    if (result.success) {
        Utils.infoMsg('初始化参数设置成功！');
    }
}

function handleAddBreakPoint(result, extraData) {
    if (result.success) {
        Utils.infoMsg('断点注册成功！');
    }

    if (extraData && extraData.autoStartRun) {
        takeNormalStep(cmdTypes.typeRun);
    }
}

function handleStepOver(result) {
    if (result.data && result.data.status === 'stopping') {
        Utils.danderMsg(result.message);
        sendCmd(cmdTypes.typeRun, '', {'skipCallHandler': true});
        return;
    }

    if (result.success) {
        // 需要更新代码
        updateSrcCodeBlock(result);
        // 同时发出拉取ctx、stack请求
        sendCmd(cmdTypes.typeFetchCtxStack);
    } else {
        Utils.danderMsg(result.message);
    }
}

function handleStepInto(result) {
    handleStepOver(result);
}

function handleStepOut(result) {
    handleStepOver(result);
}

function handleRun(result) {
    handleStepOver(result);
}

function handleRunToLine(result) {
    handleStepOver(result);
}

function handleStop(result) {
    Utils.infoMsg(result.message);
    $('.J_init').attr('disabled', true);

    setTimeout( function() {
        window.location.reload();
    }, 900);
}

function handlePropertyGet(result, node) {
    if (result.success && result.data.length > 0) {
        // 重新渲染数据
        var remoteNode = result.data[0];
        node.nodes = getNodesInfo(remoteNode.children);
        $('.J_ctxBody').treeview(true).render();
    } else {
        Utils.danderMsg(result.message);
    }
}

function handleFetchCtxStack(result) {
    if (result.success) {
        updateContextBlock(result);
        updateStackBlock(result);
    } else {
        Utils.danderMsg(result.message);
    }
}

function formatFile(file) {
    file = file.replace('file://', '');
    file = file.replace($('input[name=basePath]').val().trim(), '');
    return file;
}

function updateSrcCodeBlock(result) {
    if (!result.success) {
        return;
    }
    var codeInfo = result.data.srccode;

    var file = formatFile(Utils.base64.decode(codeInfo.breakedFile));
    var lineNo = parseInt(Utils.base64.decode(codeInfo.breakedLine));
    var moreLine = parseInt(Utils.base64.decode(codeInfo.moreLine));
    var codeLines = Utils.base64.decode(codeInfo.code);
    codeLines = codeLines.split('\n');

    // 判断hightLine
    var firstLineNo = lineNo - moreLine;

    var highlightLine = -1;
    if (firstLineNo >= 1) {
        highlightLine = firstLineNo + moreLine;
    } else if (firstLineNo === 0) {
        firstLineNo = 1;
        highlightLine = moreLine;
    } else {
        firstLineNo = 1;
        highlightLine = lineNo;
    }

    reBuildCodeViewer(file, codeLines, firstLineNo, highlightLine);
}

function reBuildCodeViewer(file, codeLines, firstLineNo, highlightLine) {
    firstLineNo = parseInt(firstLineNo);
    highlightLine = parseInt(highlightLine);

    $('.J_codeBody').html('');

    var html = sprintf('<span>{%s}</span>\n', [file]);
    for (var i = 0; i < codeLines.length; i++) {
        var currLineNo = i + firstLineNo;
        html += sprintf('<span class="lineno">{%s}:</span><span class="{%s}">{%s}</span>\n',
            [currLineNo, (currLineNo === highlightLine ? 'highlight' : ''), Utils.encodedHtmlEntity(codeLines[i])]
        );
    }

    $('.J_codeBody').html('<pre><code>' + html + '</code></pre>');
}

function reBuildBptViewer() {
    var list = getBptList();

    $('.J_bptBody').html('');
    for (var i = 0; i < list.length; i++) {
        var file = formatFile(list[i].file);
        var line = list[i].line;
        $('.J_bptBody').append(sprintf('<span>{%s},{%s}</span><br>', [file, line]));
    }
}

function getBptList() {
    var list = [];

    var breakPointData = $('.J_addBptPanel').data('bptData');
    if (!breakPointData) {
        breakPointData = {};
    }

    // Cookie中存储一份
    Utils.setCookie('breakPointData', JSON.stringify(breakPointData));
    Utils.setCookie('basePath', $('input[name=basePath]').val().trim());

    for (var tmpFile in breakPointData) {
        for (var idx in breakPointData[tmpFile]) {
            var tmpLine = breakPointData[tmpFile][idx];
            list.push({'file': tmpFile, 'line': tmpLine});
        }
    }

    return list;
}

function tryLoadChildrenNodes(arg1, node) {
    if (['array','stdClass'].indexOf(node.type) >= 0 &&
        node.children_num > 0 &&
        (!node.nodes || node.nodes.length === 0)) {
        sendCmd(cmdTypes.typePropertyGet, Utils.base64.encode(node.name), node);
    } else {
        // 重新渲染数据
        $('.J_ctxBody').treeview(true).render();
    }
}

function updateContextBlock(result) {
    if (result.data.context && result.data.context.length > 0) {
        var treeData = getNodesInfo(result.data.context);
        $('.J_ctxBody').treeview({data: treeData, levels: 5});
        $('.J_ctxBody').treeview('collapseAll', {silent: true});
    }
}

function updateStackBlock(result) {
    if (result.data.stack && result.data.stack.length > 0) {
        var stacks = result.data.stack;

        var html = '';
        for (var i = 0; i < stacks.length; i++) {
            html += sprintf('file: {%s} ==&gt; {%s}()<br>--------------<br>', [
                formatFile(stacks[i].file), stacks[i].where
            ]);
        }
        $('.J_stackBody').html(html);
    }
}

function takeNormalStep(cmdType, content) {
    sendCmd(cmdType, content);
}

function getNodesInfo(variableList) {
    var infoList = [];

    if (!variableList || variableList.length === 0) {
        return infoList;
    }

    for (var idx in variableList) {
        var one = variableList[idx];

        var node = {};
        node.name = one.name;
        node.type = one.type;

        if (['string','bool','int','float'].indexOf(one.type) >= 0) {
            node.text = sprintf('{%s} = {%s} ({%s})', [one.name, one.text, one.type]);
        } else if (['array', 'stdClass'].indexOf(one.type) >= 0) {
            node.text = sprintf('{%s} ({%s}) [{%s}]', [one.name, one.type, one.children_num]);
        } else {
            node.text = sprintf('{%s} ({%s})', [one.name, one.type]);
        }

        if (one.children_num > 0) {
            node.children_num = one.children_num;
            node.nodes = getNodesInfo(one.children);
        }

        infoList.push(node);
    }

    return infoList;
}

function reRegisterBreakPoint() {
    var breakPointData = $('.J_addBptPanel').data('bptData');
    if (!breakPointData) {
        breakPointData = {};
    }

    var bptList = [];
    for (var tmpFile in breakPointData) {
        for (var idx in breakPointData[tmpFile]) {
            bptList.push({file: tmpFile, line: breakPointData[tmpFile][idx]});
        }
    }

    if (bptList.length < 1) {
        Utils.danderMsg('请先添加断点！');
        return;
    }

    sendCmd(cmdTypes.typeAddBreakPoint, bptList);
    Utils.infoMsg('重新注册断点...');
}

function sprintf(strFmt, args) {
    for (var i = 0; i < args.length; i++) {
        strFmt = strFmt.replace(/{%s}/, args[i]);
    }
    return strFmt;
}

function recoverDataFromCookies() {
    // 自动从Cookie中恢复SessionID
    var tmpSessMd5 = Utils.getCookie('sessionMd5');
    if (tmpSessMd5) {
        sessionMd5 = tmpSessMd5;
    }

    var basePath = Utils.getCookie('basePath');
    if (basePath) {
        $('input[name=basePath]').val(basePath);
    }

    var breakPointData = Utils.getCookie('breakPointData');
    if (breakPointData) {
        $('.J_addBptPanel').data('bptData', JSON.parse(breakPointData));
        reBuildBptViewer();
    }
}










// ------------- 执行区域 -------------
var tmpBpt = {};
var cmdTypes = {
    typeInitConn: 0,
    typeCheckConn: 1,
    typeAddBreakPoint: 2,
    typeStepOver: 3,
    typeStepInto: 4,
    typeStepOut: 5,
    typeStop: 6,
    typeRun: 7,
    typeFeatureSet: 8,
    typePropertyGet: 9,
    typeFetchCtxStack: 10,
    typeRunToLine: 11,
};

var timeIntervalMap = {
    checkConnDivTimeout: 0,
    checkConnInterval: 0,
    normalStepFetchCtxStackTimeout: 0,
};

var maxWaitConnTime = 85;

var sessionMd5;
var handlerMap = {};
for (var tmp in cmdTypes) {
    var handlerName = tmp.replace(/^type/, 'handle');
    var EVAL_IS_BAD = eval;
    handlerMap[cmdTypes[tmp]] = EVAL_IS_BAD(handlerName);
}

$( function() {
    recoverDataFromCookies();

    $('.panel-default').on('click', 'pre code span', function() {
        var _this = $(this);
        if (_this.hasClass('onselect')) {
            _this.removeClass('onselect');
        } else {
            _this.parent().find('span').removeClass('onselect');
            _this.addClass('onselect');
        }
    });

    $('.J_init').on('click', function() {
        var bptList = getBptList();
        if (bptList.length < 1) {
            Utils.danderMsg('请先添加断点！');
            return;
        }

        sendCmd(cmdTypes.typeInitConn);
    });

    $('.J_checkConnBtn').on('click', function() {
        Utils.infoMsg('Xdebug连接检测中，请勿操作...');
        sendCmd(cmdTypes.typeCheckConn);
    });

    $('a.J_addBpt').on('click', function() {
        $('.J_addBptPanel').modal('show');
    });

    $('.J_clearBpt').on('click', function() {
        $('.J_addBptPanel').data('bptData', {});
        reBuildBptViewer();
    });

    $('.J_runToLine').on('click', function() {
        var $selectLine = $('pre code span.onselect');
        if ($selectLine.length < 1) {
            Utils.danderMsg('请先点击代码行，代码将被自动选中');
            return;
        }

        var fileName = $('pre code span').eq(0).html().trim();
        var fileLine = parseInt( $selectLine.prev().html() );
        takeNormalStep(cmdTypes.typeRunToLine, {'file': fileName, 'line': fileLine});
    });

    $('.J_stop').on('click', function() {
        sendCmd(cmdTypes.typeStop);
        $('.J_checkConn').addClass('hide');
    });

    $('.J_stepOver').on('click', function() {
        takeNormalStep(cmdTypes.typeStepOver);
    });
    $('.J_stepInto').on('click', function() {
        takeNormalStep(cmdTypes.typeStepInto);
    });
    $('.J_stepOut').on('click', function() {
        takeNormalStep(cmdTypes.typeStepOut);
    });
    $('.J_run').on('click', function() {
        takeNormalStep(cmdTypes.typeRun);
    });

    $('.J_ctxBody').parent().on('nodeExpanded', tryLoadChildrenNodes);

    $('.J_addBptPanel [name=add]').on('click', function() {
        var file = $('.J_addBptPanel input[name=file]').val().trim();
        var line = $('.J_addBptPanel input[name=line]').val().trim();

        if (!file) {
            Utils.danderMsg('invalid file name');
            return;
        }

        if (isNaN(line)) {
            Utils.danderMsg('invalid file line number');
            return;
        }

        if (file && file[0] !== '/') {
            var basePath = $('input[name=basePath]').val().trim();
            if (!basePath) {
                Utils.danderMsg('BasePath not found! Either input BasePath first, or file path must be absolute path');
                return;
            }
            file = basePath + '/' + file;
        }
        // 去除多余的斜杠
        file = file.replace(/\/{2,}/g, '/');
        line = parseInt(line);

        var breakPointData = $('.J_addBptPanel').data('bptData');
        if (!breakPointData) {
            breakPointData = {};
        }

        var list = breakPointData[file] ? breakPointData[file] : [];
        if (list.indexOf(line) >= 0) {
            Utils.danderMsg('断点已存在，无需重复添加！');
            return;
        }
        list.push(line);
        list.sort();
        breakPointData[file] = list;
        // 存储数据
        $('.J_addBptPanel').data('bptData', breakPointData);

        // 隐藏modal
        $('.J_addBptPanel').modal('hide');
        // 更新View
        reBuildBptViewer();

        if (window.autoRefreshBptList) {
            reRegisterBreakPoint();
        }
    });

});
