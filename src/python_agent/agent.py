# coding:UTF-8

import SimpleHTTPServer
import SocketServer
import json
import base64
import dbgp
import breakpoint as bpt
from dbgp import Logger

class Task:
    md5 = None
    type = None
    content = None

    def __init__(self, md5, type, content):
        self.md5 = md5
        self.type = type
        self.content = content


class TaskHandler:

    typeInitConn = 0
    typeCheckConn = 1
    typeAddBreakPoint = 2
    typeStepOver = 3
    typeStepInto = 4
    typeStepOut = 5
    typeStop = 6
    typeRun = 7
    typeFeatureSet = 8
    typePropertyGet = 9
    typeFetchCtxStack = 10
    typeRunToLine = 11

    dbgpApi = None

    def __init__(self):
        global GlobalDbgpApi
        self.dbgpApi = GlobalDbgpApi

    def updateDbgpApi(self):
        global GlobalDbgpApi
        GlobalDbgpApi = self.dbgpApi

    def isApiConnected(self):
        return self.dbgpApi and self.dbgpApi.conn.isconnected()

    def handleTask(self, jsonTask):
        task = Task(jsonTask['md5'], int(jsonTask['type']), jsonTask['content'])

        result = dbgp.CommonResult()
        result.md5 = task.md5

        if task.type == self.typeInitConn and self.isApiConnected():
            result.success = True
            result.message = 'already connected!'
            return result

        if not self.isApiConnected():
            # 只有初始化Task可以初始化Api
            if task.type == self.typeInitConn:
                try:
                    self.dbgpApi = dbgp.DbgpApi()
                except Exception as e:
                    Logger.error('new dbgp api excp:' + str(e))
                    self.dbgpApi = None

                if self.dbgpApi is None:
                    result.message = 'init xdebug conn failed'
                else:
                    result.success = True
                    result.message = 'init xdebug conn success'
            else:
                result.message = 'xdebug session expired, please try reconnect'

            self.updateDbgpApi()
            return result

        handlerName = 'handler_' + self.getTypeStr(task.type)[4:]
        handler = getattr(self, handlerName)

        if handler:
            result = handler(task)
        else:
            result.message = 'handler not found'

        return result

    def getTypeStr(self, typeCode):
        for tmpStr in dir(self):
            if tmpStr.startswith('type') and getattr(self, tmpStr) == typeCode:
                return tmpStr
        return None

    def handler_CheckConn(self, task):
        result = dbgp.CommonResult()
        result.md5 = task.md5

        if self.dbgpApi.conn.isconnected():
            result.success = True
            result.message = 'connected!'
        else:
            result.message = 'not connected'

        return result

    def handler_AddBreakPoint(self, task):
        result = dbgp.CommonResult()
        result.md5 = task.md5

        if not task.content or len(task.content) < 1:
            result.message = 'invalid break point'
            return result

        success = False
        for item in task.content:
            breakP = bpt.LineBreakpoint(item['file'], item['line'])
            tmpResult = self.dbgpApi.breakpoint_set(breakP.get_cmd())
            if tmpResult.success:
                # 一个成功即视为成功
                success = True

        if success:
            result.success = True
            result.message = 'add breakpoint success!'
        else:
            result.message = 'add breakpoint failed!' + tmpResult.message
        return result

    def getBreakedSrcCode(self, prevLine = 10):
        result = self.dbgpApi.getSrcCodeBlock(prevLine)
        if result.success:
            base64code, breakedFile, breakedLine = result.data
            srcCodeInfo = {
                'breakedFile': base64.b64encode(str(breakedFile)),
                'breakedLine': base64.b64encode(str(breakedLine)),
                'moreLine': base64.b64encode(str(prevLine)),
                'code': base64code}
            return srcCodeInfo
        return None

    def getBreakedContext(self):
        ctxTotal = []
        tmpResult = self.dbgpApi.context_names()
        if tmpResult.success:
            nameDict = tmpResult.data.names()
            for ctxId in nameDict:
                result = self.dbgpApi.context_get(ctxId)
                if result.success:
                    ctx = self.getFullCtxInfo(result.data.get_context(), nameDict[ctxId])
                    ctxTotal = ctxTotal + ctx

        return ctxTotal

    def getFullCtxInfo(self, attrList, ctxName = None):
        ctxList = []

        for attrTmp in attrList:
            variable = {}
            variable['name'] = attrTmp.display_name
            variable['text'] = attrTmp.value
            variable['type'] = attrTmp.type
            variable['children_num'] = attrTmp.num_declared_children
            variable['children'] = None
            if len(attrTmp.children) > 0:
                variable['children'] = self.getFullCtxInfo(attrTmp.children)
            ctxList.append(variable)

        if ctxName == 'User defined constants':
            variable = {}
            variable['name'] = 'CONST_LIST'
            variable['text'] = ''
            variable['type'] = 'array'
            variable['children_num'] = len(ctxList)
            variable['children'] = ctxList
            ctxList = [variable]

        return ctxList

    def getBreakedCallStack(self):
        stackList = []
        result = self.dbgpApi.stack_get()
        if result.success:
            for info in result.data.get_stack():
                stack = {}
                stack['file'] = info.attrib['filename']
                stack['level'] = info.attrib['level']
                stack['type'] = info.attrib['type']
                stack['where'] = info.attrib['where']
                stackList.append(stack)

        return stackList

    def appendSrcCodeWhenBreaked(self, result):
        result.data = {}
        result.data['status'] = self.dbgpApi.lastStatus

        if result.success and self.dbgpApi.lastStatus == 'break':
            result.data['srccode'] = self.getBreakedSrcCode()
        else:
            result.success = False
            result.message = 'fetch Src Code failed. status:' + self.dbgpApi.lastStatus
        return result

    def handler_StepOver(self, task):
        result = self.dbgpApi.step_over()
        return self.appendSrcCodeWhenBreaked(result)

    def handler_StepInto(self, task):
        result = self.dbgpApi.step_into()
        return self.appendSrcCodeWhenBreaked(result)

    def handler_StepOut(self, task):
        result = self.dbgpApi.step_out()
        return self.appendSrcCodeWhenBreaked(result)

    def handler_Run(self, task):
        result = self.dbgpApi.run()
        result = self.appendSrcCodeWhenBreaked(result)
        if self.dbgpApi.lastStatus == 'stopping':
            result.success = False
            result.message = '执行已结束，请检查断点是否有效！status:' + self.dbgpApi.lastStatus
        return result

    def handler_RunToLine(self, task):
        breakP = bpt.LineBreakpoint(task.content['file'], task.content['line'])
        result = self.dbgpApi.breakpoint_set(breakP.get_cmd())
        if not result.success:
            result.success = False
            result.message = 'set break point failed!'
            result.data = ''
            return result

        result = self.dbgpApi.run()
        result = self.appendSrcCodeWhenBreaked(result)
        if self.dbgpApi.lastStatus == 'stopping':
            result.success = False
            result.message = '执行已结束，请检查断点是否有效！status:' + self.dbgpApi.lastStatus
        return result

    def handler_Stop(self, task):
        result = self.dbgpApi.stop()
        result.data = ''
        return result

    def handler_FeatureSet(self, task):
        success = False
        if isinstance(task.content, dict):
            for name in task.content:
                tmpResult = self.dbgpApi.feature_set(name, task.content[name])
                if tmpResult.success:
                    success = True

        result = dbgp.CommonResult()
        result.md5 = task.md5
        if success:
            result.success = True
            result.message = 'feature set ok!'
        else:
            result.success = False
            result.message = 'feature set failed!'
        return result

    def handler_PropertyGet(self, task):
        propName = base64.b64decode(task.content)
        result = self.dbgpApi.property_get(propName)
        if result.success:
            ctx = self.getFullCtxInfo(result.data.get_context())
            result.data = ctx

        return result

    def handler_FetchCtxStack(self, task):
        result = self.dbgpApi.status()

        if result.success and self.dbgpApi.lastStatus == 'break':
            result.data = {}
            result.data['context'] = self.getBreakedContext()
            result.data['stack'] = self.getBreakedCallStack()
        else:
            result.success = False
            result.message = 'fetch Context and Stack failed, status:' + self.dbgpApi.lastStatus
            result.data = ''
        return result


class HttpServer(object):

    def run(self, reqHandler):
        host = '0.0.0.0'
        port = 21734
        httpd = SocketServer.TCPServer((host, port), reqHandler)

        Logger.info('serving at %s:%s' % (host, port))
        try:
            httpd.serve_forever()
        except Exception as e:
            pass
        finally:
            Logger.info('server going to shutdown...')
            httpd.server_close()
            httpd.shutdown()

class HttpReqHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):

    API_VERSION = '1.0'

    def do_GET(self):
        body = 'OK' + ('(ver:%s)' % self.API_VERSION)
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.send_header("Content-length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        self.data_string = self.rfile.read(int(self.headers['Content-Length']))
        jsonTask = json.loads(self.data_string)

        # 获取到新任务后开始处理任务
        taskHandler = TaskHandler()
        result = taskHandler.handleTask(jsonTask)
        # 设置版本号
        result.apiVer = self.API_VERSION

        try:
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(result.toJsonString())
        except Exception as e:
            'do_POST exception:' + str(e)


# ---------- 执行区域 ----------
GlobalDbgpApi = None
HttpServer().run(HttpReqHandler)
