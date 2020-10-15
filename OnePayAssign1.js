const dataSet1 = [{
    id: "123-456",
    user: "steve",
    transactionAmount: 13.4,
    category: "food"
  },
  {
    id: "43-456",
    user: "kelly",
    transactionAmount: 124,
    category: "food"
  },
  {
    id: "4565-3",
    user: "steve",
    transactionAmount: -12.4,
    category: "food"
  },
  {
    id: "573-383",
    user: "robert",
    transactionAmount: 5.4,
    category: "food"
  },
  {
    id: "148-403",
    user: "anne",
    transactionAmount: "-",
    category: "food"
  },
  {
    id: "381-493",
    user: "anne",
    transactionAmount: 50,
    category: "drink"
  },
  {
    id: "373-301",
    user: "anne",
    transactionAmount: 30,
    category: "drink"
  },
  {
    id: "1111-49",
    user: "robert",
    transactionAmount: "-",
    category: "drink"
  },
  {
    id: "4891-30",
    user: "kelly",
    transactionAmount: 9,
    category: "drink"
  },
  {
    id: "5719",
    user: "steve",
    transactionAmount: 200,
    category: "other"
  },
  {
    id: "1820-329",
    user: "roger",
    transactionAmount: 30,
    category: "other"
  },
  {
    id: "473-301",
    user: "roger",
    transactionAmount: 32,
    category: "other"
  },
];
const dataSet2 = "balanceAdjustment,uuid,customer,group\r\n0,46b3c5ef-cfac-456d-bb31-e8f9a3d80c2f,STEVE,food\r\n100,cce91905-e7cb-46e8-b93f-b9cf10678e2f,KELLY,food\r\n60,2c00a840-52e8-4482-8197-5212ba255554,STEVE,food\r\n0,2c00a840-52e8-4482-8197-5212ba255554,STEVE,food\r\n18,3931c272-a442-432f-9c92-33a3307bb4b9,ROBERT,food\r\n400,844bb6cb-d0ad-411a-89d2-37e25bdba754,ANNE,food\r\n60,f855dd1e-4ef7-482d-b698-5b76e7dfc9b9,ANNE,drinks\r\n60,4c2436eb-27d0-4ea7-b25e-5308d69dafd6,ANNE,drinks\r\n26.8,4b99cade-fdcb-428f-b7bb-0b932dcdafa9,ROBERT,drinks\r\n248,f696f690-1a24-40bc-89f4-98d0a39c35ef,KELLY,drinks\r\n-24.8,051d963b-3b39-463b-a712-c08cbaafa43f,STEVE,misc\r\n-24.8,4155460f-21a9-43e1-a693-3b0eae7f3032,AMBER,misc\r\n10.8,4155460f-21a9-43e1-a693-3b0eae7f3032,AMBER,misc\r\n\r\n";
var combineKeys = [];
var groupByParams = ["user"];
const formatter = new Intl.NumberFormat('en-UK', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2
});

function groupBy(data, keys) { // `data` is an array of objects, `keys` is the array of keys (or property accessor) to group by
  // reduce runs this anonymous function on each element of `data` (the `item` parameter,
  // returning the `storage` parameter at the end
  return data.reduce((storage, item) => {
    // returns an object containing keys and values of each item
    const groupValues = keys.reduce((values, key) => {
      values[key] = item[key];

      return values;
    }, {});
    // get the first instance of the key by which we're grouping
    const group = Object.values(groupValues).join(' ').toLowerCase();
    combineKeys.push(group);
    // set `storage` for this instance of group to the outer scope (if not empty) or initialize it
    storage[group] = storage[group] || [];

    // add this item to its group within `storage`
    if (keys.every((key) => item[key] === groupValues[key])) {

      storage[group].push(item);
    }

    // return the updated storage to the reduce function, which will then loop through the next 
    return storage;
  }, {}); // {} is the initial value of the storage
}

function csvToJson(csv) {
  var lines = csv.split('\n');
  var result = [];
  var headers = ["transactionAmount", "id", "user", "category"];

  for (var i = 1; i < lines.length; i++) {
    var obj = {};

    var row = lines[i],
      queryIdx = 0,
      startValueIdx = 0,
      idx = 0;

    if (row.trim() === '') {
      continue;
    }

    while (idx < row.length) {
      /* if we meet a double quote we skip until the next one */
      var c = row[idx];

      if (c === '"') {
        do {
          c = row[++idx];
        } while (c !== '"' && idx < row.length - 1);
      }

      if (c === ',' || /* handle end of line with no comma */ idx === row.length - 1) {
        /* we've got a value */
        var value = row.substr(startValueIdx, idx - startValueIdx).trim();

        /* skip first double quote */
        if (value[0] === '"') {
          value = value.substr(1);
        }
        /* skip last comma */
        if (value[value.length - 1] === ',') {
          value = value.substr(0, value.length - 1);
        }
        /* skip last double quote */
        if (value[value.length - 1] === '"') {
          value = value.substr(0, value.length - 1);
        }

        var key = headers[queryIdx++].replace('\r', '');
        obj[key] = value;
        startValueIdx = idx + 1;
      }

      ++idx;
    }

    result.push(obj);
  }
  return result;
}

function distinct(value, index, self) {
  return self.indexOf(value) === index;
}

var combineDS = function(ds1, ds2) {
  return [...ds1, ...ds2];
}

function processDatasets(data1, data2) {
  let result = [];

  try {

    //first converted csv into same format as dataset1 to make it easier to deal with
    let csvObj = csvToJson(data2);
    if (csvObj != null) {
      //combine data sets into 1 data set to bring consistency in actions
      let combinedData = combineDS(data1, csvObj);
      if (combinedData != null) {

        //make groups as required - user and category wise
        var groupedData = groupBy(combinedData, groupByParams);

        if (groupedData != null) {

          //console.log(groupedData);
          //based on groups got created, identify distinct ones
          let uniqueKeys = combineKeys.filter(distinct);

          //traverse through each group and sum up their total spents
          //converted - to 0
          //also converting total with currency code £ as mentioned in requirement
          if (uniqueKeys != null) {
            let id = 0;
            uniqueKeys.forEach(key => {
              let total = 0;
              let foodSpent = 0;
              let drinkSpent = 0;
              let otherSpent = 0;
              let catGroupedData = groupBy(groupedData[key], ["category"]);

              console.log(key);
              console.log(catGroupedData);

              if (catGroupedData["food"] != null) {
                foodSpent = catGroupedData["food"].reduce((n, {
                    transactionAmount
                  }) =>
                  n + parseFloat(transactionAmount.toString().replace("-", "0")), 0)
              }

              if (catGroupedData["drink"] != null) {
                drinkSpent = catGroupedData["drink"].reduce((n, {
                    transactionAmount
                  }) =>
                  n + parseFloat(transactionAmount.toString().replace("-", "0")), 0)
              }
              if (catGroupedData["drinks"] != null) {
                drinkSpent = catGroupedData["drinks"].reduce((n, {
                    transactionAmount
                  }) =>
                  n + parseFloat(transactionAmount.toString().replace("-", "0")), 0)
              }

              if (catGroupedData["other"] != null) {
                otherSpent = catGroupedData["other"].reduce((n, {
                    transactionAmount
                  }) =>
                  n + parseFloat(transactionAmount.toString().replace("-", "0")), 0)
              }
              if (catGroupedData["misc"] != null) {
                otherSpent = catGroupedData["misc"].reduce((n, {
                    transactionAmount
                  }) =>
                  n + parseFloat(transactionAmount.toString().replace("-", "0")), 0)
              }
              result.push({
                Id: ++id,
                Name: key,
                FoodSpent: formatter.format(foodSpent),
                DrinkSpent: formatter.format(drinkSpent),
                OtherSpent: formatter.format(otherSpent),
                TotalSpent: formatter.format(foodSpent + drinkSpent + otherSpent) //as instructed in requirements
              })
            });

            //  console.log(result);
          } else {
            console.log('Unable to find distinct groups')
          }
        } else {
          console.log('Unable to group data')
        }
      } else {
        console.log('Unable to combine data sets')
      }
    } else {
      console.log('Unable to parse csv, check csv data format')
    }
  } catch (err) {
    console.log(err)
  }
  return result;
}

function displayData(result) {
  if (result != null) {
    result.forEach(element => {
      console.log(element.Name + ' spent ' + element.FoodSpent + ' on food, ' + element.DrinkSpent + ' on drinks and on other items ' + element.OtherSpent + '. Altogether spent ' + element.TotalSpent)
    });
  } else {
    console.log('No data found');
  }
}

let result = processDatasets(dataSet1, dataSet2);
displayData(result);