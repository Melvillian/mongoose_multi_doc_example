const mongoose = require('mongoose');

// the run-rs command will by default start the replica sets on the following ports
const dbUri = 'mongodb+srv://dbUser:vF2eEctcBYK0ynFUHnBFlXpgZ@cluster0-8upbj.mongodb.net/sample_airbnb?retryWrites=true&w=majority';
// a simple mongoose model
const userSchema = new mongoose.Schema({
  email: String, name: String, reservations: mongoose.Schema.Types.Mixed 
});


const User = mongoose.model('User', userSchema);

const listingsAndReviewsSchema = new mongoose.Schema({
  name: mongoose.Schema.Types.String, datesReserved: mongoose.Schema.Types.Mixed 
}, { collection: 'listingsAndReviews' });
const ListingsAndReviews = mongoose.model('listingsAndReviews', listingsAndReviewsSchema);

async function main() {
  // connecting the DB
  await mongoose.connect(dbUri/*, { replicaSet: 'rs' }*/);

  await createReservation(
    "leslie@example.com",
    "Infinite Views",
    [new Date("2019-12-31"), new Date("2020-01-01")],
    { pricePerNight: 180, specialRequests: "Late checkout", breakfastIncluded: true }
  );
}

async function createReservation(userEmail, nameOfListing, reservationDates, reservationDetails) {
  const reservation = createReservationDocument(nameOfListing, reservationDates, reservationDetails);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      console.log('beginning');
      const usersUpdateResults = await User.updateOne(
       { email: userEmail },
       { $addToSet: { reservations: reservation } }
      );

     console.log(`${usersUpdateResults.n} document(s) found in the users collection with the email address ${userEmail}.`);
     console.log(`${usersUpdateResults.nModified} document(s) was/were updated to include the reservation.`);

      const isListingReservedResults = await ListingsAndReviews.findOne(
        { name: nameOfListing, datesReserved: { $in: reservationDates } }
      );

      console.log('made it to isListingReservedResults');
      
      if (isListingReservedResults) {
        await session.abortTransaction();
        console.error("This listing is already reserved for at least one of the given dates. The reservation could not be created.");
        console.error("Any operations that already occurred as part of this transaction will be rolled back.");
        return;
      }

      const listingsAndReviewsUpdateResults = await ListingsAndReviews.updateOne(
        { name: nameOfListing },
        { $addToSet: { datesReserved: { $each: reservationDates } } }
      );
      console.log(`${listingsAndReviewsUpdateResults.n} document(s) found in the listingsAndReviews collection with the name ${nameOfListing}.`);
      console.log(`${listingsAndReviewsUpdateResults.nModified} document(s) was/were updated to include the reservation dates.`);
      console.log('reached end of transaction');

    })
  } finally {
    session.endSession();
  }
}

function createReservationDocument(nameOfListing, reservationDates, reservationDetails) {
  // Create the reservation
  let reservation = {
    name: nameOfListing,
    dates: reservationDates,
  }

  // Add additional properties from reservationDetails to the reservation
  for (let detail in reservationDetails) {
    reservation[detail] = reservationDetails[detail];
  }

  return reservation;
}

main().catch(console.error);
