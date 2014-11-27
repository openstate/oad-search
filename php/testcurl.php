<?php

$ch = curl_init("http://api.opencultuurdata.nl/v0/search");

$post_fields = '{"from":0,"size":12,"query":"rembrandt","facets":{"collection":[null],"date":{"interval":"year"},"author":[]},"filters":{"media_content_type":{"terms":["image\/jpeg","image\/jpg","image\/gif","image\/png"]},"date":{"from":"2-01-01","to":"2006-12-31"},"collection":{"terms":["Rijksmuseum","Amsterdam Museum","Open Beelden","Tropenmuseum","Fries Museum"]},"author":{"terms":["Rembrandt Harmensz. van Rijn"]}}}';

curl_setopt($ch, CURLOPT_CUSTOMREQUEST,  "POST");

curl_setopt($ch, CURLOPT_POSTFIELDS, $post_fields);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Content-Type: application/json',
    'Content-Length: ' . strlen($post_fields)));
$result = curl_exec($ch);

if (curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200) {
    echo '<pre>';
    print_r($post_fields);
    print_r($result);
    echo '</pre>';
}

?>