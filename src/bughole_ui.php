<html>
<head>
    <title>Bughole</title>
    <link rel="stylesheet" href="/bootstrap.css" type="text/css" media="all">
    <style type="text/css">
        .lineno {
            margin-right: 10px;
        }
        pre code span.highlight {
            background-color: #7be6a1;
        }
        pre code span.onselect {
            background-color: #d8dacc;
        }
        .modal-dialog {
            margin-left: 0px;
        }
        .panel-default {
            margin-left: 5px;
            width: 48%;
            display: inline-block;
        }
        .panel-body {
            padding: 5px;
            height: 500px;
            overflow-y: scroll;
            overflow-x: scroll;
        }
        .panel-heading {
            height: 45px;
        }
        .bread-crumb {
            margin: 0px;
        }
        .treeview .list-group-item {
            cursor: pointer;
        }

        .treeview span.indent {
            margin-left: 10px;
            margin-right: 10px;
        }

        .treeview span.icon {
            width: 12px;
            margin-right: 5px;
        }

        .treeview .node-disabled {
            color: silver;
            cursor: not-allowed;
        }
    </style>

</head>
<body>



<div style="height: 25px;">
    <img name="loading" class="hide" src="http://wx1.sinaimg.cn/large/6480dca9gy1fqihfepnx8g200o00ot8j.gif">
    <span class="J_checkConn hide">
        请尽快触发断点处业务！（如果Xdebug拦截成功，待调试的业务将处于hanging状态，不会立即返回结果)
    </span>
</div>

<div class="panel panel-default" style="width: 52%;">
    <div class="panel-heading">
        <div class="panel-title">
            <strong>代码区</strong>&nbsp;&nbsp;
            <a href="javascript:;" class="btn btn-xs btn-success J_init">建立连接</a>&nbsp;&nbsp;
            <a href="javascript:;" class="btn btn-xs btn-danger J_stop">Stop</a>&nbsp;
            <a href="javascript:;" class="btn btn-xs btn-success J_run">Run</a>&nbsp;
            <a href="javascript:;" class="btn btn-xs btn-info J_stepOver">StepOver</a>&nbsp;
            <a href="javascript:;" class="btn btn-xs btn-default J_stepInto">StepInto</a>&nbsp;
            <a href="javascript:;" class="btn btn-xs btn-default J_stepOut">StepOut</a>&nbsp;
            <a href="javascript:;" class="btn btn-xs btn-default J_runToLine">RunToLine</a>
        </div>
    </div>
    <div class="panel-body J_codeBody">
    </div>
</div>

<div class="panel panel-default" style="width: 44%;">
    <div class="panel-heading">
        <div class="panel-title">
            <strong>Context</strong>
        </div>
    </div>
    <div class="panel-body J_ctxBody"></div>
</div>

<div class="panel panel-default">
    <div class="panel-heading">
        <div class="panel-title">
            <strong>断点</strong>&nbsp;&nbsp;
            <a href="javascript:;" class="btn btn-xs btn-default J_clearBpt">清空</a>
            <a href="javascript:;" class="btn btn-xs btn-success J_addBpt">Add</a>
            | BasePath：
            <input type="text" name="basePath" value="/data/webroot/www/beibei/"
                   style="width: 50%;">
        </div>
    </div>
    <div class="panel-body J_bptBody"></div>
</div>

<div class="panel panel-default">
    <div class="panel-heading">
        <div class="panel-title">
            <strong>Call Stack</strong>
        </div>
    </div>
    <div class="panel-body J_stackBody"></div>
</div>

<!-- modal -->
<div class="modal fade alert-box in J_addBptPanel" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">X</button>
                <h4 class="modal-title">断点信息</h4>
            </div>
            <div class="modal-body">
                <div class="input-group">BasePath如果存在，则支持填写相对路径；当然绝对路径也支持</div>
                <div class="form-group">
                    <div class="input-group">
                        <span class="input-group-addon">文件路径：</span>
                        <input type="text" class="form-control" name="file">
                    </div>
                    <div class="input-group">
                        <span class="input-group-addon">断点行号：</span>
                        <input type="text" class="form-control" name="line">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <span name="msg"></span>&nbsp;
                <button type="button" class="btn btn-default" data-dismiss="modal">取消</button>
                <button type="button" class="btn btn-primary" name="add">确定</button>
            </div>
        </div>
    </div>
</div>

<script type="text/javascript">
    <?php
        $page_data = [
            'autoFetchStackCtxTimeout' => 2500,
        ];
    ?>
    window.pageData = <?php echo json_encode($page_data)?>
</script>




</body></html>