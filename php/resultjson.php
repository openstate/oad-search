<?php
header('Content-type: application/json');
//report error and notices in JSON so its available in the angular app.

include_once 'errortoJSON.php';
include_once 'ocd.php';
include_once 'LZString.php';

/*
 * Default values 
 *  
 */
$total = 0;
$normalsize = 12;
$thumbnailsize = 36;
$count_pages = 0;
$page = 1;


// 'van gogh executie' (only 3 results)
// 'rijksmuseum (about 5800 results)
define("DEF_QUERY", "test"); // gives nice results

/*
 * The action
 *  
 */

$q = filter_input(INPUT_GET, 'q') ? filter_input(INPUT_GET, 'q') : DEF_QUERY;
$source_id = filter_input(INPUT_GET, 'source_id') ? filter_input(INPUT_GET, 'source_id') : null;
$page = filter_input(INPUT_GET, 'page') ? filter_input(INPUT_GET, 'page') : $page ;
$options = filter_input(INPUT_GET, 'options') ? filter_input(INPUT_GET, 'options') : FALSE;

$use_facets = filter_input(INPUT_GET, 'use_facets') && filter_input(INPUT_GET, 'use_facets') == 'false' ? 
   FALSE : TRUE;


$size = filter_input(INPUT_GET, 'thumbnailresults') ? $thumbnailsize : $normalsize;


//to not use unnessacery recources, only use facets if needed.
//TODO: fix assiosiative array 'hack'
if($use_facets){
$facets = array(
        'source_id' => (object) null, 
        'date'  =>  array(
            'interval' => 'year'
            ),
        'author' => (object) null,
        'rights' => (object) null
        );

} else {
    $facets = array(
        //the OCD script cant handle empty facet. For now use only one facet. TODO: fix.
        'source_id' => (object) null
    );
}

$filters = array(
    'media_content_type' => array(
        'terms' => array('image/jpeg','image/jpg','image/gif','image/png')
        )
    );


if($options){
    $LZString = new LZString();
    $options = json_decode ($LZString->decompressFromBase64($options), true);
    
    foreach ($options as $key => $termlist){
        if($key == 'date'){
            $filters['date'] = array(
                'from' => $termlist['usermin'].'-01-01',
                'to' => $termlist['usermax'].'-12-31'
            );
       } else if($key == 'onlyvideo'){
        
            $filters['media_content_type']['terms'] = array('video/mp4', 'video/ogg', 'video/webm');
       } else {
            $filters[$key] = array(
                'terms' => $termlist
            );
       }
    }
}

//print_r($filters);

if ($q) {
    $ocd = new Ocd();

    $offset = ($page - 1) * $size;


    $results = $ocd->search($q)
    ->add_facets($facets)
    ->add_filters($filters)
    ->limit($size)
    ->query($offset);
    // yields an iterable object

    $total = $ocd->total();
    $count_pages = ceil($total / $size);

    $jsonreturn = array(

            "facets" => $results->get_facets(),
            "results" => array(),
            "pages" => $count_pages

            );

    foreach($results as $item){
        array_push($jsonreturn['results'], $item);
    }
 
    echo json_encode($jsonreturn);
}



?>
