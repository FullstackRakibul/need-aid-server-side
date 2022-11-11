const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.port || 5000;
app.use(cors());
app.use(express.json());
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const uri = `mongodb+srv://${user}:${password}@cluster0.sm41jne.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

async function run() {
  try {
    const database = client.db("funds").collection("allfunds");
    const donorCollectionDatabase = client.db("donors").collection("topdonors");
    const raffleBuyerCollection = client.db("raffle").collection("buyers");
    const raffleBuyerIdCollection = client.db("raffle").collection("buyerId");
    const raffleWinnerCollection = client
      .db("raffle")
      .collection("raffleWinner");
    const giftCardCollection = client.db("giftCards").collection("giftCard");

    // top donors insert here
    // const docs = {
    //   userUid: "0epYuhx6cKeCw6mGQlOg0qNFvGb2",
    //   name: "vatar",
    //   email: "vatar@gmail.com",
    //   amount: 1000,
    // };
    // const result1 = await donorCollectionDatabase.insertOne(docs);
    // console.log(result1);

    // // total funds insert here
    // const docs = [
    //   {
    //     total: 0,
    //     emergencyFund: {
    //       total: 0,
    //       all: {
    //         fireVictims: 0,
    //         floodRelief: 0,
    //       },
    //     },
    //     sadaqahFund: {
    //       total: 0,
    //       all: {
    //         buildAMasjid: 0,
    //         buildAWaterWell: 0,
    //         ramadanIfter: 0,
    //         zakat: 0,
    //       },
    //     },
    //     organizationalFund: {
    //       total: 0,
    //       all: {
    //         orphans: 0,
    //         oldAgeHome: 0,
    //       },
    //     },
    //     healthFund: {
    //       total: 0,
    //       all: {
    //         eyesightRestoration: 0,
    //         disablity: 0,
    //       },
    //     },
    //     generalFund: {
    //       total: 0,
    //       all: {
    //         education: 0,
    //         winterAppearl: 0,
    //         treePlantation: 0,
    //       },
    //     },
    //     specialFund: {
    //       total: 0,
    //       all: {
    //         rikshawFor1000: 0,
    //       },
    //     },
    //   },
    // ];
    // const result = await database.insertMany(docs);
    // console.log(`${result.insertedCount} documents were inserted`);

    app.post("/jwt", (req, res) => {
      const user = req.body;
      // console.log("user fuck", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });
      console.log({ token });
      res.send({ token });
    });

    app.post("/isadmin", (req, res) => {
      const userUid = req.body.userUid;
      const user = req.body;
      if (!(userUid === process.env.ADMIN_USER_UID)) {
        console.log("this is not admin");
        res.status(401).send("unauthorised admin access");
      } else {
        console.log("this is admin");
        const token = jwt.sign(user, process.env.ADMIN_ACCESS_TOKEN_SECRET, {
          expiresIn: "5h",
        });
        console.log({ token });
        res.send({ token });
      }
    });

    const verifyJWT = (req, res, next) => {
      if (!req.headers.authorization) {
        console.log("before step 1 , authorization is here");
        return res.status(401).send("unauthorised access");
      }
      const token = req.headers.authorization.split(" ")[1];
      // console.log(token);
      if (req?.headers?.actor === "Admin") {
        console.log("is an admin");
        jwt.verify(
          token,
          process.env.ADMIN_ACCESS_TOKEN_SECRET,
          function (err, decoded) {
            if (err) {
              return res.status(403).send("forbidden access");
            }
            req.decoded = decoded;
            next();
          }
        );
      } else {
        console.log("not an admin");
        jwt.verify(
          token,
          process.env.ACCESS_TOKEN_SECRET,
          function (err, decoded) {
            if (err) {
              return res.status(403).send("forbidden access");
            }
            req.decoded = decoded;
            next();
          }
        );
      }
    };

    app.get("/topdonorlist", async (req, res) => {
      const query = {};
      const cursor = donorCollectionDatabase.find(query);
      const result = await cursor.toArray();
      console.log(result);
      function topDonorAccendingList(arr) {
        const length = arr.length;
        for (let i = 0; i < length; i++) {
          for (let j = 0; j < length; j++) {
            if (arr[j].amount < arr[j + 1]?.amount) {
              //swap
              let temp = arr[j];
              arr[j] = arr[j + 1];
              arr[j + 1] = temp;
            }
          }
        }
        return arr;
      }
      const topDonorList = topDonorAccendingList(result);
      // console.log(topDonorList);
      //   res.send(result);
      if (topDonorList.length <= 5) {
        res.send(topDonorList);
      } else {
        const topFivedonorList = topDonorList.slice(0, 5);
        res.send(topFivedonorList);
      }
    });
    app.get("/currentuserprofile", verifyJWT, async (req, res) => {
      // console.log(req.decoded);
      const query = req.query;
      if (req.decoded.userUid != req.query.userUid) {
        console.log(" unauthorised acces");
        return res.status(403).send("unauthorised access");
      }
      console.log("query", query);
      const result = await donorCollectionDatabase.findOne(query);
      res.send(result);
    });
    app.get("/allfunds", async (req, res) => {
      const query = {};
      console.log("xxhitted");
      const allFunds = await database.findOne(query);
      console.log("hitted");
      // since this method returns the matched document, not a cursor, print it directly
      console.log("all funds here", allFunds);
      res.send(allFunds);
    });

    app.put("/fundsupdate", async (req, res) => {
      const funds = req.body;
      const { fundCategory, fundType, amount, donor } = funds;
      const parseAmount = parseInt(amount);
      //   console.log("user donating amount:", parseAmount);
      //   console.log("donor uid", donor);

      const query = { _id: ObjectId("6362c1fc3c4ada004b94f1cd") };
      let previousFund = await database.findOne(query);
      //   let updatedFund = { ...previousFund };
      // since this method returns the matched document, not a cursor, print it directly
      let previousFundGrandTotal = previousFund.total;
      let selectedFundCategory = previousFund[fundCategory];
      let selectedFundCategoryTotal = selectedFundCategory.total;
      let selectedFundCategoryAll = selectedFundCategory.all;
      let selectedFundType = selectedFundCategoryAll[fundType];
      //   console.log("grand total:", previousFundGrandTotal);
      //   console.log("selectedFundCategory:", selectedFundCategory);
      //   console.log("selectedFundType:", selectedFundType);
      //   console.log("selectedFundCategoryTotal:", selectedFundCategoryTotal);
      //   console.log(data);
      const updatedSelectedFundType = selectedFundType + parseAmount;
      const updatedSelectedFundCategoryTotal =
        selectedFundCategoryTotal + parseAmount;
      const updatedFundGrandTotal = previousFundGrandTotal + parseAmount;
      //   updatedFund.total = updatedFundGrandTotal;
      //   updatedFund.

      console.log("\n\nold", previousFund);
      previousFund.total = updatedFundGrandTotal;
      selectedFundCategory.total = updatedSelectedFundCategoryTotal;
      selectedFundCategoryAll[fundType] = updatedSelectedFundType;
      //   console.log("updated", previousFund);
      const {
        total,
        emergencyFund,
        sadaqahFund,
        organizationalFund,
        healthFund,
        generalFund,
        specialFund,
      } = previousFund;
      const updatedFund = {
        total,
        emergencyFund,
        sadaqahFund,
        organizationalFund,
        healthFund,
        generalFund,
        specialFund,
      };
      const filter = { _id: ObjectId("6362c1fc3c4ada004b94f1cd") };
      // this option instructs the method to create a document if no documents match the filter
      const options = { upsert: true };
      // create a document that sets the plot of the movie
      const updateDoc = {
        $set: updatedFund,
      };
      const result = await database.updateOne(filter, updateDoc, options);
      console.log("\n\nresult:", result);
      console.log("\n\nupdated value:", updatedFund);

      //   top donor updatae here
      if (donor?.userUid) {
        console.log("update top donor list is processing ...");
        const query = {
          userUid: donor.userUid,
        };
        let selectedPreviousDonor = await donorCollectionDatabase.findOne(
          query
        );
        console.log("donor", donor);
        let donorx = { ...donor };
        if (!selectedPreviousDonor) {
          console.log("this is new donor");
          console.log(donorx);
          const donorAmount = donorx.amount;
          const donorAmountParse = parseInt(donorAmount);
          //   let donor = { ...donor };
          donorx.amount = donorAmountParse;
          const result = await donorCollectionDatabase.insertOne(donorx);
          console.log(result);
        } else {
          console.log("this is old donor");
          console.log(selectedPreviousDonor);
          console.log("this is new donation\n", donorx);
          const previousDonatedAmountParse = selectedPreviousDonor.amount;
          const currentDonatedAmountString = donorx.amount;
          const currentDonatedAmountParse = parseInt(
            currentDonatedAmountString
          );
          const updatedDonatedAmount =
            previousDonatedAmountParse + currentDonatedAmountParse;

          console.log("previous donated", previousDonatedAmountParse);
          console.log("current donated", currentDonatedAmountParse);
          console.log("total donated", updatedDonatedAmount);
          selectedPreviousDonor.amount = updatedDonatedAmount;
          console.log("updated donation list", selectedPreviousDonor);
          const filter = { ...query };

          console.log("filter", filter);

          // this option instructs the method to create a document if no documents match the filter
          const options = { upsert: true };
          // create a document that sets the plot of the movie
          const updateDoc = {
            $set: selectedPreviousDonor,
          };
          const result = await donorCollectionDatabase.updateOne(
            filter,
            updateDoc
          );
          console.log(result);
        }
      }
    });

    app.post("/rafflebuy", async (req, res) => {
      console.log(req.body);
      let buyers = req.body;

      const query = {};
      const result = await raffleBuyerIdCollection.findOne(query);
      const previousBuyersIdCollection = result?.buyersIdCollection;
      const previousBuyersIdCollectionId = result?._id;
      let buyersIdCollection = [];
      let buyerId = Math.floor(Math.random() * 99999);
      if (!previousBuyersIdCollection) {
        console.log("no previous buyers id collection");

        while (buyerId < 10000) {
          buyerId = Math.floor(Math.random() * 99999);
        }
        buyersIdCollection.push(buyerId);
        buyersIdCollection = { buyersIdCollection };
        const result = await raffleBuyerIdCollection.insertOne(
          buyersIdCollection
        );
        console.log(result);
      } else {
        console.log("also have previous buyer id collection");
        while (
          buyerId < 10000 ||
          previousBuyersIdCollection.includes(buyerId)
        ) {
          buyerId = Math.floor(Math.random() * 99999);
        }
        const currentBuyerIdCollection = [
          ...previousBuyersIdCollection,
          buyerId,
        ];
        buyersIdCollection = { buyersIdCollection: currentBuyerIdCollection };

        const filter = { _id: ObjectId(previousBuyersIdCollectionId) };
        // this option instructs the method to create a document if no documents match the filter
        const options = { upsert: true };
        // create a document that sets the plot of the movie
        const updateDoc = {
          $set: buyersIdCollection,
        };
        const firstResult = await raffleBuyerIdCollection.updateOne(
          filter,
          updateDoc,
          options
        );
      }
      // console.log("result from mongo", result);
      // console.log(
      //   "previousBuyersIdCollection from mongo",
      //   previousBuyersIdCollection
      // );
      buyers.buyerId = buyerId;
      const finalResult = await raffleBuyerCollection.insertOne(buyers);
      if (finalResult.acknowledged) {
        res.send(buyers);
      } else {
        res.send("there have some problem");
      }
    });
    app.get("/drawraffle", verifyJWT, async (req, res) => {
      const query = {};
      const result = await raffleBuyerIdCollection.findOne(query);
      console.log("result", result);
      if (!result) {
        console.log("something went wrong");
        res.status(401).send("okk");
      } else {
        const buyerIdArray = result?.buyersIdCollection;
        console.log("buyerIdArray", buyerIdArray);
        let winnerTicketNoList = [];
        let tottalSellingTicket = buyerIdArray.length - 1;

        let generateWinner = () => {
          let winnerTicketNo = Math.floor(Math.random() * tottalSellingTicket);
          console.log("okk", winnerTicketNo);
          while (
            winnerTicketNo > tottalSellingTicket ||
            winnerTicketNoList.includes(winnerTicketNo)
          ) {
            winnerTicketNo = Math.floor(Math.random() * tottalSellingTicket);
          }
          if (winnerTicketNoList.length === 5) {
            return;
          }

          winnerTicketNoList.push(winnerTicketNo);
          generateWinner();
        };

        generateWinner();

        const winnerIdList = winnerTicketNoList.map(
          (winnerTicketNo) => buyerIdArray[winnerTicketNo]
        );

        console.log("buyer id array", buyerIdArray);
        console.log("winner ticket no in array", winnerTicketNoList);
        console.log("winner ID in array", winnerIdList);
        const raffleWinnerCollectionDeleted =
          await raffleWinnerCollection.deleteMany({});
        let winnerList = [];
        const getWinner = async () => {
          winnerIdList.forEach(async (winnerId) => {
            let filter = {
              buyerId: winnerId,
            };
            let winnerResult = await raffleBuyerCollection.findOne(filter);

            const result = await raffleWinnerCollection.insertOne(winnerResult);
          });

          const raffleBuyerIdCollectionDeleted =
            await raffleBuyerIdCollection.deleteMany({});
          const raffleBuyerCollectionDeleted =
            await raffleBuyerCollection.deleteMany({});
        };
        getWinner();

        res.send(result);
      }
    });

    app.get("/raffleresult", async (req, res) => {
      const query = {};
      const cursor = await raffleWinnerCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.post("/sendgiftcard", verifyJWT, async (req, res) => {
      const giftCard = req.body;
      // console.log(req.headers);
      const result = await giftCardCollection.insertOne(giftCard);
      const isSent = result.acknowledged;
      res.send(isSent);
    });
    app.get("/checknotification", async (req, res) => {
      const previousNotificationLength = req.headers.totalnotification;
      // console.log(req.headers);
      const userUid = req.headers.useruid;
      // console.log("userUid", userUid);
      const query = {
        toDonorUid: userUid,
      };
      // console.log("query", query);
      const cursor = await giftCardCollection.find(query);
      // console.log("cursor", cursor);
      const currentNotificetion = await cursor.toArray();
      // console.log("currentNotificetion", currentNotificetion);
      const currentNotificetionLength = currentNotificetion.length;
      const newNotification =
        currentNotificetionLength - previousNotificationLength;
      console.log("old", previousNotificationLength);
      console.log("current", currentNotificetionLength);
      console.log("new", newNotification);
      if (newNotification) {
        const currentNotificetionCollections = {
          newNotification,
          currentNotificetionLength,
          currentNotificetion,
        };
        const xxx = JSON.stringify(currentNotificetionCollections);
        res.send(xxx);
      } else {
        //  sample data for send response
        const noNewNotification = {
          noNotification: "no new notification",
        };
        const xxx = JSON.stringify(noNewNotification);
        res.send(xxx);
      }
    });
    app.get("/giftcard/:id", async (req, res) => {
      const giftId = req.params.id;

      const query = {
        _id: ObjectId(giftId),
      };
      const result = await giftCardCollection.findOne(query);
      // console.log("gift card \n", result);
      res.send([result]);
    });
    app.get("/giftcards/:uid", async (req, res) => {
      const userUid = req.params.uid;
      const query = {
        toDonorUid: userUid,
      };
      // console.log("query", query);
      const cursor = await giftCardCollection.find(query);
      // console.log("cursor", cursor);
      const currentNotificetion = await cursor.toArray();
      res.send(currentNotificetion);
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("listening on port", port);
});
