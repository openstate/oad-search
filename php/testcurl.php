<?php
$ch = curl_init("http://localhost:5000/v0/search");

//$post_fields = '{size":1,"query":"de","facets":{"collection":{}}}';


$post_fields = '{"query": "de","facets": {"collection": {}}, "filters": {"media_content_type": {"terms": ["image\/jpeg", "video\/webm"]}},"size": 1}';

curl_setopt($ch, CURLOPT_CUSTOMREQUEST,  "POST");

curl_setopt($ch, CURLOPT_POSTFIELDS, $post_fields);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Content-Type: application/json',
    'Content-Length: ' . strlen($post_fields)));


$result = curl_exec($ch);

if (curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200) {
    echo '<pre>';

    print_r($result);
    echo '</pre>';
}

?>