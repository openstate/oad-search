<?php
//header('Content-Type: text/html; charset=utf-8');
header('Content-type: application/json');

include_once 'ocd.php';

// Function to get redirect location of the OpenCultuurData Resolver URLs
// We use this as a temporary solution to get smaller sized images from Rijksmuseum

function resolve_url($url) {
//                $ocd = new Ocd();
//                return $ocd->resolve($url);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    $output = curl_exec($ch);

    preg_match_all('/^Location:(.*)$/mi', $output, $matches);

    $redirect_url = !empty($matches[1]) ? trim($matches[1][0]) : $url;

    return $redirect_url;
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


if ($q) {
    $ocd = new Ocd();

    $offset = ($page - 1) * $size;


    $results = $ocd->search($q)
            ->add_facets(array('collection' => array($collection)))
            ->add_filters(array('media_content_type' => array('terms' => $media_content_type_terms)))
            ->limit($size)
            ->query($offset);
    // yields an iterable object

    $total = $ocd->total();
    $count_pages = ceil($total / $size);
      
}

//this class returns a object with the relevant JsonData;
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

header('Content-Type: application/json');
echo json_encode(new JsonReturn($results, $count_pages), JSON_PRETTY_PRINT);

?>
