// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

var fetchAjax = function(paramsObj) {  
    return new Promise((resolve, reject) => {
      $.ajax(paramsObj)
        .done((response) => resolve(response))
        .fail((err) => reject(err));
    });
  } 