<?php

/**
 * Just in case of that you don't have a full-setup PHP website, we provide this example PHP website
 * which just has a simple index file to let you quick start debugging this example PHP website via bughole.
 *
 * If you already have your PHP website setup, please ignore this example project
 */
class Index {

    public function handle_request() {
        $x = 10;
        $y = 20;
        $z = 30;
        $tmp_arr = [$x, $y, $z];

        echo "Welcome to example-php-website! Let's do some simple math.<hr>";
        
        $tmp_result = MathTool::add($x, $y);
        echo 'add: ' . $tmp_result . '<br/>';

        $tmp_result = MathTool::sum($tmp_arr);
        echo 'sum: ' . $tmp_result . '<br/>';

        $tmp_result = MathTool::gen_object($tmp_arr);
        echo 'gen_object: ' . json_encode($tmp_result) . '<br/>';
        exit();
    }

}

class MathTool {

    public static function add($x, $y) {
        $z = $x + $y;
        return $z;
    }

    public static function sum($num_arr) {
        if (!$num_arr || !is_array($num_arr)) {
            return NULL;
        }

        $sum = 0;
        foreach ($num_arr as $_num) {
            if (is_numeric($_num)) {
                $sum = $sum + $_num;
            }
        }

        return $sum;
    }

    public static function gen_object($num_arr) {
        $obj = new stdClass();

        foreach ($num_arr as $_num) {
            $obj_attr = 'attr_' . $_num;
            $obj->$obj_attr = 'value_' . $_num;
        }

        $obj->done = TRUE;

        return $obj;
    }
}

(new Index())->handle_request();
