registerCommand('rdns',
  'rdns <ip> .... lookup the reverse DNS entry for an IP address',
function(term, ip) {
  iframe = document.getElementById('webcontent');

  iframe.src = 'http://my-addr.com/reverse-lookup-domain-hostname/free-reverse-ip-lookup-service/reverse_lookup.php?addr='+ip;
});

registerCommand('myip',
  'myip ......... show information about the current outgoing IP address',
function(term, line) {
  iframe = document.getElementById('webcontent');

  iframe.src = 'http://my-addr.com/your-ip-and-city-country-isp-latitude-longitude/geo-ip-region-lookup/my_geo.php';
});

registerCommand('whois',
  'whois [domain] load the whois page for the current (or specified) domain',
function(term, domain) {
  iframe = document.getElementById('webcontent');
  if (!domain) domain = iframe.src;

  iframe.src = 'http://whois.domaintools.com/'+encodeURIComponent(domain);
});

