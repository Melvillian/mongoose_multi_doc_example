const mongoose = require('mongoose');

const dbUri = process.env.DB_URI; 
// a simple mongoose model


/////   Setup the user and listingsAndReviews collections /////

const userSchema = new mongoose.Schema({
  email: String, name: String, reservations: mongoose.Schema.Types.Mixed 
});
const User = mongoose.model('User', userSchema);

const listingsAndReviewsSchema = new mongoose.Schema({
  name: mongoose.Schema.Types.String, datesReserved: mongoose.Schema.Types.Mixed 
}, { collection: 'listingsAndReviews' });
const ListingsAndReviews = mongoose.model('listingsAndReviews', listingsAndReviewsSchema);


/////                                                   /////


/**
 * Make a reservation by updating the user and listingsAndReviews collections atomically using
 * transactions
**/
async function main() {
  // connecting the DB
  await mongoose.connect(dbUri, {  useNewUrlParser: true, useUnifiedTopology: true });

  await createReservation(
    "leslie@example.com",
    "Infinite Views",
    [new Date("2019-12-31"), new Date("2020-01-01")],
    { pricePerNight: 180, specialRequests: "Late checkout", breakfastIncluded: true }
  );
}

/**
 * Makes a reservation for a particular User on a particular listing
**/
async function createReservation(userEmail, nameOfListing, reservationDates, reservationDetails) {
  const reservation = createReservationDocument(nameOfListing, reservationDates, reservationDetails);

  // start the session, which will encapsulate our atomic operations.
  const session = await mongoose.startSession();
  try {
    // Any changes within this Transaction will only be visible to external clients once the Transaction completes
    await session.withTransaction(async () => {
      const usersUpdateResults = await User.updateOne(
       { email: userEmail },
       { $addToSet: { reservations: reservation } }
      );

     console.log(`${usersUpdateResults.n} document(s) found in the users collection with the email address ${userEmail}.`);
     console.log(`${usersUpdateResults.nModified} document(s) was/were updated to include the reservation.`);

      const isListingReservedResults = await ListingsAndReviews.findOne(
        { name: nameOfListing, datesReserved: { $in: reservationDates } }
      );

      // we don't want to double update a listingsAndReviews
      if (isListingReservedResults) {
        await session.abortTransaction();
        console.error("This listing is already reserved for at least one of the given dates. The reservation could not be created.");
        console.error("Any operations that already occurred as part of this transaction will be rolled back.");
        return;
      }

      // go ahead and make the reservation on the listingsAndReviews
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
    process.exit(0);
  }
}

/**
 * Creates the BSON document for updating a reservation
 **/
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
