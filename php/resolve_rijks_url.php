<?php
header('Content-type: application/json');

//report error and notices in JSON so its available in the angular app.
include_once 'errortoJSON.php';

$url = filter_input(INPUT_GET, 'url') ? filter_input(INPUT_GET, 'url') : null;



//get redirect location of the OpenCultuurData Resolver URLs
// We use this as a temporary solution to get smaller sized images from Rijksmuseum
if(isset($url)) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    $output = curl_exec($ch);

    preg_match_all('/^Location:(.*)$/mi', $output, $matches);
    $redirect_url = !empty($matches[1]) ? trim($matches[1][0]) : $url;
    echo '{"url":"'. addslashes($redirect_url) . '"}';
}
?>