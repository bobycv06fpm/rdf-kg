<?php

// $Id: //

/**
 * @file config.php
 *
 * Global configuration variables (may be added to by other modules).
 *
 */

global $config;

// Date timezone
date_default_timezone_set('UTC');


// Proxy settings for connecting to the web--------------------------------------------------------- 
// Set these if you access the web through a proxy server. 
$config['proxy_name'] 	= '';
$config['proxy_port'] 	= '';

//$config['proxy_name'] 	= 'wwwcache.gla.ac.uk';
//$config['proxy_port'] 	= '8080';


// local CouchDB
$config['couchdb_options'] = array(
		'database' => 'refcon15',
		'host' => 'localhost',
		'port' => 5984,
		'prefix' => 'http://'
		);

// IrisCouch
$config['couchdb_options'] = array(
		'database' => 'refcon15',
		'host' => 'rdmpage:peacrab@rdmpage.iriscouch.com',
		'port' => 6984,
		'prefix' => 'https://'
		);

// HTTP proxy
if ($config['proxy_name'] != '')
{
	if ($config['couchdb_options']['host'] != 'localhost')
	{
		$config['couchdb_options']['proxy'] = $config['proxy_name'] . ':' . $config['proxy_port'];
	}
}

$config['journal_map_key'] = 'wydADzs_TzRsa8J82z-4';
	
?>