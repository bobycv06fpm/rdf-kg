{
   "_id": "_design/triples",
   "_rev": "10-baec77c3c2688f8e31b2bd47cc0e5d81",
   "language": "javascript",
   "lists": {
       "n-triples": "function(head,req) { var headers = ''; var row; start({ 'headers': { 'Content-Type': 'text/plain' } }); while(row = getRow()) { send(row.value + '\\n'); } }"
   },
   "views": {
       "nt": {
           "map": "// potentially shared code\nfunction triple($subject, $predicate, $object) {\n  var triple = [];\n  triple[0] = $subject;\n  triple[1] = $predicate;\n  triple[2] = $object;\n\n  return triple;\n}\n\nfunction quad($subject, $predicate, $object, $context) {\n  var triple = [];\n  triple[0] = $subject;\n  triple[1] = $predicate;\n  triple[2] = $object;\n  triple[3] = $context;\n\n  return triple;\n}\n\n\nfunction wrap(s, html) {\n  if (s.match(/^(http|urn)/)) {\n    if (html) {\n      s = '&lt;' + s + '&gt;';\n    } else {\n      s = '<' + s + '>';\n    }\n  } else {\n    s = '\"' + s.replace(/\"/, '\\\"') + '\"';\n  }\n  return s;\n}\n\nfunction output(doc, triples) {\n  if (0) {\n    // Output triples\n    var html = '<table width=\"100%\">';\n    for (var i in triples) {\n      var s = 0;\n      var p = 1;\n      var o = 2;\n      console.log(JSON.stringify(triples[i]));\n      html += '<tr><td>' + wrap(triples[i][s], true) + '</td><td>' + wrap(triples[i][p], true) + '</td><td>' + wrap(triples[i][o], true) + ' .</td></tr>';\n    }\n    html += '</table>';\n    $('#output').html(html);\n  } else {\n    // CouchDB\n    for (var i in triples) {\n      var s = 0;\n      var p = 1;\n      var o = 2;\n      emit(doc._id, wrap(triples[i][s], false) + ' ' + wrap(triples[i][p], false) + ' ' + wrap(triples[i][o], false) + ' . ');\n    }\n  }\n}\n\n//-----Mendeley-----\nfunction mendeley(doc) {\n  var triples = [];\n\n  var cluster_id = '';\n\n  var identifiers = [];\n\n\n  // get identifiers\n  if (doc.identifiers) {\n    for (var i in doc.identifiers) {\n      switch (i) {\n        case 'doi':\n        \tvar doi = doc.identifiers[i];\n        \t// clean\n        \tdoi = doi.replace(/DOI:\\s*/i, '');\n        \tcluster_id = 'http://identifiers.org/doi/' + doi;\n        \t\n        triples.push(triple(cluster_id,\n          'http://purl.org/dc/terms/identifier',\n          'http://identifiers.org/doi/' + doi));\n        \t\n        \t\n        \tbreak;\n        case 'pmid':\n         var pmid = doc.identifiers[i];\n         triples.push(triple(cluster_id,\n          'http://purl.org/dc/terms/identifier',\n          'http://identifiers.org/pmid/' +  pmid));\n       \t\n        \t// PMID is cluster_id if not already set\n        \tif (cluster_id == '') {\n        \t  cluster_id = 'http://identifiers.org/pmid/' + doc.identifiers[i];\n        \t}\n        \tbreak;\n        \t\n        default:\n          break;\n      }\n    }\n  }\n  if (cluster_id == '') {\n     cluster_id = 'urn:uuid:' + doc.id; // _id\n  }\n  \n  \n\n  // fields\n  for (var i in doc) {\n    switch (i) {\n\n      case 'type':\n        switch (doc[i]) {\n          case 'journal':\n            triples.push(triple(cluster_id,\n              'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n              'http://schema.org/ScholarlyArticle'));\n            break;\n          default:\n            break;\n        }\n        break;\n\n\n        // title can be string or array\n      case 'title':\n        if (Array.isArray(doc[i])) {\n          for (var j in citeproc[i]) {\n            triples.push(triple(cluster_id,\n              'http://schema.org/name',\n              doc[i][j]));\n          }\n        } else {\n          triples.push(triple(cluster_id,\n            'http://schema.org/name',\n            doc[i]));\n        }\n        break;\n        \n      case 'authors':\n        var n = doc[i].length;\n        for (var j = 0; j < n; j++) {\n          var author_id = cluster_id + '#author_' + (j + 1);\n\n          // type, need to handle organisations as authors\n          triples.push(triple(author_id,\n            'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n            'http://schema.org/Person'));\n\n          triples.push(triple(cluster_id,\n            'http://schema.org/author',\n            author_id));\n\n          // name\n          var name = '';\n          if (doc[i][j].first_name) {\n            triples.push(triple(author_id,\n              'http://schema.org/givenName', // ?\n              doc[i][j].first_name));\n\n            name += doc[i][j].first_name;\n          }\n          if (doc[i][j].last_name) {\n            triples.push(triple(author_id,\n              'http://schema.org/familyName', // ?\n              doc[i][j].last_name));\n\n            name += ' ' + doc[i][j].last_name;\n          }\n\n          if (name != '') {\n            triples.push(triple(author_id,\n              'http://schema.org/name', // ?\n              name));\n          }\n\n        }\n        break;        \n        \n      case 'abstract':\n        triples.push(triple(cluster_id,\n          'http://schema.org/description',\n          doc[i]));\n        break;\n        \n\n        // tags\n      case 'tags':\n        for (var j in doc[i]) {\n          triples.push(triple(cluster_id,\n            'http://schema.org/about',\n            doc[i][j]));\n        }\n        break;\n\n \n\n      default:\n        break;\n    }\n  }\n\n\n  // defaults\n  triples.push(triple(cluster_id,\n    'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n    'http://schema.org/CreativeWork'));\n    \n  // default identifier is Mendeley UUID\n\t triples.push(triple(cluster_id,\n\t  'http://purl.org/dc/terms/identifier',\n\t  'urn:uuid:' + doc.id));\n    \n\n  output(doc, triples);\n\n}\n\n//-----crossref citeproc-----\n\nfunction citeproc(doc) {\n  var triples = [];\n\n  var cluster_id = '';\n\n  var identifiers = [];\n\n  // CiteProc format data \n  var citeproc = doc;\n\n  // If via CrossRef API then it's wrapped in a message\n  if (doc.message) {\n    citeproc = doc.message;\n  }\n\n  // get identifiers\n  for (var i in citeproc) {\n    switch (i) {\n\n      case 'DOI':\n        var cluster_id = 'http://identifiers.org/doi/' + citeproc[i];\n\n        triples.push(triple(cluster_id,\n          'http://purl.org/dc/terms/identifier',\n          'http://identifiers.org/doi/' + citeproc[i]));\n        break;\n\n        // any alternative ids\n      case 'alternative-id':\n        for (var j in citeproc[i]) {\n          triples.push(triple(cluster_id,\n            'http://purl.org/dc/terms/identifier',\n            citeproc[i][j]));\n        }\n        break;\n\n      default:\n        break;\n    }\n  }\n\n\n  // fields\n  for (var i in citeproc) {\n    switch (i) {\n\n      case 'type':\n        switch (citeproc[i]) {\n          case 'journal-article':\n            triples.push(triple(cluster_id,\n              'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n              'http://schema.org/ScholarlyArticle'));\n            break;\n          default:\n            break;\n        }\n        break;\n\n        // title can be string or array\n      case 'title':\n        if (Array.isArray(citeproc[i])) {\n          for (var j in citeproc[i]) {\n            triples.push(triple(cluster_id,\n              'http://schema.org/name',\n              citeproc[i][j]));\n          }\n        } else {\n          triples.push(triple(cluster_id,\n            'http://schema.org/name',\n            citeproc[i]));\n        }\n        break;\n\n        // article metadata\n      case 'issue':\n        triples.push(triple(cluster_id,\n          'http://schema.org/issueNumber',\n          citeproc[i]));\n        break;\n\n      case 'pages':\n        triples.push(triple(cluster_id,\n          'http://schema.org/pagination',\n          citeproc[i]));\n        break;\n\n      case 'volume':\n        triples.push(triple(cluster_id,\n          'http://schema.org/volumeNumber',\n          citeproc[i]));\n        break;\n\n        // journal\n      case 'ISSN':\n        for (var j in citeproc[i]) {\n          var journal_id = 'http://www.worldcat.org/issn/' + citeproc[i][j];\n          triples.push(triple(cluster_id,\n            'http://schema.org/isPartOf',\n            journal_id\n          ));\n\n          // type\n          triples.push(triple(journal_id,\n            'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n            'http://schema.org/Periodical'));\n\n          // issn\n          triples.push(triple(journal_id,\n            'http://schema.org/issn',\n            citeproc[i][j]));\n\n          // journal name can be string or array\n          if (Array.isArray(citeproc['container-title'])) {\n            for (var j in citeproc['container-title']) {\n              triples.push(triple(journal_id,\n                'http://schema.org/name',\n                citeproc['container-title'][j]));\n            }\n          } else {\n            triples.push(triple(journal_id,\n              'http://schema.org/name',\n              citeproc['container-title']));\n          }\n\n        }\n        break;\n\n        // authors (may include ORCIDs)\n        // if no ORCID then we have a bnode, so create an identifier to make this addressable\n      case 'author':\n        var n = citeproc[i].length;\n        for (var j = 0; j < n; j++) {\n          var author_id = '';\n\n          // create identifier\n          if (citeproc[i][j].ORCID) {\n            author_id = citeproc[i][j].ORCID;\n          } else {\n            // #hash identifier \n            author_id = cluster_id + '#author_' + (j + 1);\n          }\n\n          // type, need to handle organisations as authors\n          triples.push(triple(author_id,\n            'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n            'http://schema.org/Person'));\n\n          triples.push(triple(cluster_id,\n            'http://schema.org/author',\n            author_id));\n\n          // name\n          var name = '';\n          if (citeproc[i][j].given) {\n            triples.push(triple(author_id,\n              'http://schema.org/givenName', // ?\n              citeproc[i][j].given));\n\n            name += citeproc[i][j].given;\n          }\n          if (citeproc[i][j].family) {\n            triples.push(triple(author_id,\n              'http://schema.org/familyName', // ?\n              citeproc[i][j].family));\n\n            name += ' ' + citeproc[i][j].family;\n          }\n\n          if (name != '') {\n            triples.push(triple(author_id,\n              'http://schema.org/name', // ?\n              name));\n          }\n          \n          // affiliation\n          // eventually this should be a role because\n          // people can change their affiliation\n         if (citeproc[i][j].affiliation) {            \n            for (var k in citeproc[i][j].affiliation) {\n               if (citeproc[i][j].affiliation[k].name) {\n                 triples.push(triple(author_id,\n                  'http://schema.org/affiliation', \n                  citeproc[i][j].affiliation[k].name));\n               }\n             }\n          }\n         \n\n        }\n        break;\n\n        // publisher\n        // should this be linked to journal rather than article?\n      case 'publisher':\n        triples.push(triple(cluster_id,\n          'http://schema.org/publisher',\n          citeproc[i]));\n        break;\n\n        // funding\n      case 'funder':\n        var n = citeproc[i].length;\n        for (var j = 0; j < n; j++) {\n          var funder_id = '';\n\n          // create identifier for funder\n          if (citeproc[i][j].DOI) {\n            funder_id = 'http://identifiers.org/doi/' + citeproc[i][j].DOI;\n          } else {\n            // #hash identifier \n            funder_id = cluster_id + '#funder_' + (j + 1);\n          }\n\n          // create funder \n          triples.push(triple(funder_id,\n            'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n            'http://schema.org/Organisation'));\n\n          triples.push(triple(funder_id,\n            'http://schema.org/name',\n            citeproc[i][j].name));\n\n          // role\n          var m = citeproc[i][j].award.length;\n\n          if (m == 0) {\n            // funder but award not known\n            var award_id = funder_id + '/award';\n\n            triples.push(triple(award_id,\n              'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n              'http://schema.org/Role'));\n\n            // link to funder \n            triples.push(triple(award_id,\n              'http://schema.org/funder',\n              funder_id));\n\n            // link role to work         \n            triples.push(triple(cluster_id,\n              'http://schema.org/funder',\n              award_id));\n          } else {\n            // we have one or more awards\n            for (var a = 0; a < m; a++) {\n              var award_id = funder_id + '/award' + a;\n\n              triples.push(triple(award_id,\n                'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n                'http://schema.org/Role'));\n\n              triples.push(triple(award_id,\n                'http://schema.org/roleName',\n                citeproc[i][j].award[a]\n              ));\n\n              // link to funder \n              triples.push(triple(award_id,\n                'http://schema.org/funder',\n                funder_id));\n\n              // link role to work         \n              triples.push(triple(cluster_id,\n                'http://schema.org/funder',\n                award_id));\n            }\n          }\n        }\n        break;\n\n        // license\n      case 'license':\n        for (var j in citeproc[i]) {\n          if (citeproc[i][j].URL) {\n            triples.push(triple(cluster_id,\n              'http://schema.org/license',\n              citeproc[i][j].URL));\n          }\n        }\n        break;\n\n        // links to representions such as PDFs, XML, HTML, etc.\n        // may be links to text mining sources\n      case 'link':\n        var n = citeproc[i].length;\n        for (var j = 0; j < n; j++) {\n          var link_id = cluster_id + '#link_' + (j + 1);\n\n          // type\n          triples.push(triple(link_id,\n            'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n            'http://schema.org/CreativeWork'));\n\n          if (citeproc[i][j].URL) {\n            triples.push(triple(link_id,\n              'http://schema.org/url',\n              citeproc[i][j].URL));\n\n            if (citeproc[i][j]['content-type']) {\n              triples.push(triple(link_id,\n                'http://schema.org/fileFormat',\n                citeproc[i][j]['content-type']));\n            }\n\n            // link to work\n            triples.push(triple(cluster_id,\n              'http://schema.org/workExample',\n              link_id));\n          }\n        }\n        break;\n\n        // tags\n      case 'subject':\n        for (var j in citeproc[i]) {\n          triples.push(triple(cluster_id,\n            'http://schema.org/about',\n            citeproc[i][j]));\n        }\n        break;\n\n      default:\n        break;\n    }\n  }\n\n\n  // defaults\n  triples.push(triple(cluster_id,\n    'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',\n    'http://schema.org/CreativeWork'));\n\n  output(doc, triples);\n\n}\n\nfunction(doc) {\n  var format = '';\n  if (doc.format) {\n    format = doc.format;\n  } else {\n    if (doc.source) {\n      if (doc.source == 'CrossRef') {\n        format = 'citeproc';\n      }\n    } else {\n      if (doc.message) {\n        if (doc..message.source) {\n          if (doc.message.source == 'CrossRef') {\n            format = 'citeproc';\n          }\n        }\n      }\n    }\n  }\n\n\n   switch (format) {\n     case 'application/vnd.mendeley-document.1+json':\n       mendeley(doc);\n     break;\n\n     case 'citeproc':\n       citeproc(doc);\n     break;\n\n\n     default:\n       break;\n  \n  }\n}"
       }
   }
}