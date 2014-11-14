<?php
header('Content-type: application/json');

//report error and notices in JSON so its available in the angular app.
include_once 'errortoJSON.php';


include_once 'ocd.php';
include_once 'LZString.php';






//this class returns a object with the relevant data in JSONformat;
class JsonReturn implements JsonSerializable {

    public function __construct($result, $count_pages) {
        $this->result = $result;
        $this->count_pages = $count_pages;
    }

    public function jsonSerialize() {
        $jsonreturn = array(

            "facets" => $this->result->get_facets(),
            "results" => [],
            "pages" => $this->count_pages

            );
        foreach($this->result as $item){
            array_push($jsonreturn['results'], $item);
        }
        return $jsonreturn;
    }
}

/*
 * Default values 
 *  
 */
$total = 0;
$size = 12;
$count_pages = 0;
$page = 1;

// 'van gogh executie' (only 3 results)
// 'rijksmuseum (about 5800 results)
define("DEF_QUERY", "rembrandt+olieverf"); // gives nice results
$media_content_type_terms = array('image/jpeg','image/jpg','image/gif','image/png');

/*
 * The action
 *  
 */

$q = filter_input(INPUT_GET, 'q') ? filter_input(INPUT_GET, 'q') : DEF_QUERY;
$collection = filter_input(INPUT_GET, 'collection') ? filter_input(INPUT_GET, 'collection') : null;
$page = filter_input(INPUT_GET, 'page') ? filter_input(INPUT_GET, 'page') : $page ;
$options = filter_input(INPUT_GET, 'options') ? filter_input(INPUT_GET, 'options') : null;

$collectionshardcoded = [
"Rijksmuseum",
"Beeldbank Nationaal Archief",
"Tropenmuseum", 
"Amsterdam Museum", 
"Open Beelden", 
"Fries Museum", 
"TextielMuseum" ,
"Centraal Museum Utrecht" ,
"Koninklijke Bibliotheek - ByvanckB",
"Visserijmuseum Zoutkamp",
];

if(isset($options)){
    $LZString = new LZString();
    $options = json_decode ($LZString->decompressFromBase64($options), true);
    for($i = 0; $i < count($options['exclude']); ++$i) {
        $option = $options['exclude'][$i];
        for($j = 0; $j < count($collectionshardcoded); ++$j) {
            if($collectionshardcoded[$j] == $option){
              array_splice($collectionshardcoded, $j, 1);
                
            }
        }
    }
}


$facets = array(
    'collection' => array($collection),
    'date'  =>  array(
        'interval' => 'year'
        )
    );

$filters = array(
    'media_content_type' => array(
        'terms' => $media_content_type_terms
        ), 
    'collection' => array(
        'terms' => $collectionshardcoded
        )
    );

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

    /*echo'<pre>';
    print_r($results);
    echo'</pre>';*/

    echo json_encode(new JsonReturn($results, $count_pages), JSON_PRETTY_PRINT);
}



?>
