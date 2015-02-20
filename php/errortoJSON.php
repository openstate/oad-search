<?php

function log_error( $num, $str, $file, $line, $context = null )
{
    log_exception( new ErrorException( $str, 0, $num, $file, $line ) );
}

function log_exception( Exception $e )
{


    echo '{"error":{';
    echo '"class":"' . get_class( $e ) . '",';
    echo '"file":"'  . addslashes ($e->getFile()) . '",';
    echo '"message":"' . $e->getMessage() . '",';
    echo '"line":"' . $e->getLine() . '"';

    echo "}}";

    exit();
}

/**
* Checks for a fatal error, work around for set_error_handler not working on fatal errors.
*/
function check_for_fatal()
{
    $error = error_get_last();
    if ( $error["type"] == E_ERROR )
        log_error( $error["type"], $error["message"], $error["file"], $error["line"] );
}

register_shutdown_function( "check_for_fatal" );
set_error_handler( "log_error" );
set_exception_handler( "log_exception" );
ini_set( "display_errors", "off" );

?>