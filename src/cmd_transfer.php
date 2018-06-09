<?php

class CmdTransfer {

    const PYTHON_AGENT_API = 'http://127.0.0.1:21734';

    private $curl;

    private $debug_mode = 1;

    public function __construct() {
        if ($this->debug_mode) {
            ini_set('display_errors', 1);
        }

        $this->curl = curl_init();
        curl_setopt_array($this->curl, array(
            CURLOPT_RETURNTRANSFER => TRUE,
            CURLOPT_NOSIGNAL => 1,
            CURLOPT_CONNECTTIMEOUT_MS => 1000,
            CURLOPT_TIMEOUT_MS => 1500,
            CURLOPT_SSL_VERIFYPEER => FALSE,
            CURLOPT_SSL_VERIFYHOST => FALSE,
            CURLOPT_COOKIESESSION => TRUE,
        ));
    }

    public function send_cmd() {
        $cmd_info = json_decode(@$_POST['cmd_info']);

        if (!$cmd_info) {
            $this->output(FALSE, 'invalid data');
        }

        $cmd_obj = (object) array(
            'type' => $cmd_info->type,
            'content' => $cmd_info->content,
        );

        curl_setopt($this->curl, CURLOPT_URL, self::PYTHON_AGENT_API);
        curl_setopt($this->curl, CURLOPT_HTTPHEADER, ['Content-type: application/json; charset=utf-8']);
        curl_setopt($this->curl, CURLOPT_POSTFIELDS, json_encode($cmd_obj));

        $response = curl_exec($this->curl);
        if (FALSE === $response) {
            $response = json_encode(['success' => FALSE, 'message' => 'Call agent api failed, agent not running ?']);
        }
        $response = json_decode($response);

        $this->output($response->success, $response->message, isset($response->data) ? $response->data : NULL);
    }

    private function output($success, $msg, $data = NULL) {
        $output_result = [
            'success' => $success,
            'message' => $msg,
            'data' => $data,
        ];
        header('Content-type: application/json; charset=utf-8');
        echo json_encode($output_result);
        exit;
    }
}

(new CmdTransfer())->send_cmd();