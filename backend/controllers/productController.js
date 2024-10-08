const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncError = require('../middlewares/catchAsyncError')
const APIFeatures = require('../utils/apiFeature');

exports.getProducts = catchAsyncError(async (req, res, next)=>{
 
  const apiFeatures = new APIFeatures(Product.find(), req.query).search().filter();

    const products = await apiFeatures.query;
    //await new Promise(resolve => setTimeout(resolve,3000))
    //return next(new ErrorHandler("errorr",400))
    res.status(200).json({
        succes : true,
        message : "success",
        count : products.length,
        products
    })
})

exports.newProduct = catchAsyncError(async (req, res, next)=>{
    const product = await Product.create(req.body);
    res.status(201).json({
        success: true,
        product
    })

});



exports.getSingleProduct = catchAsyncError(async (req, res, next)=>{
    const product = await Product.findById(req.params.id);
    
    if(!product) {
       return next(new ErrorHandler('Product not found ', 400));
    }    
    res.status(201).json({
        succes : true,
        product
    })
})

exports.updateProduct = catchAsyncError(async (req, res, next)=>{
    let product = await Product.findById(req.params.id);
    
    if(!product) {
        return res.status(404).json({
            succes : false,
            message: "product not found"
        });
    }    

    product = await Product.findByIdAndUpdate(req.params.id, req.body,{
        new:true,
        runvalidators:true

   })
   res.status(200).json({
    succes : true,
    message : "success",
    product
   })

})

exports.deleteProduct = catchAsyncError(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if(!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    // Use deleteOne in place of remove
    await Product.deleteOne({ _id: req.params.id });

    res.status(200).json({
        success: true,
        message: "Product Deleted!"
    });
})

exports.createReview = catchAsyncError(async (req, res, next) =>{
    const  { productId, rating, comment } = req.body;

    const review = {
        user : req.user.id,
        rating,
        comment
    }

    const product = await Product.findById(productId);
   //finding user review exists
    const isReviewed = product.reviews.find(review => {
       return review.user.toString() == req.user.id.toString()
    })

    if(isReviewed){
        //updating the  review
        product.reviews.forEach(review => {
            if(review.user.toString() == req.user.id.toString()){
                review.comment = comment
                review.rating = rating
            }

        })

    }else{
        //creating the review
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }
    //find the average of the product reviews
    product.ratings = product.reviews.reduce((acc, review) => {
        return review.rating + acc;
    }, 0) / product.reviews.length;
    product.ratings = isNaN(product.ratings)?0:product.ratings;

    await product.save({validateBeforeSave: false});

    res.status(200).json({
        success: true
    })


})

exports.getReviews = catchAsyncError(async (req, res, next) =>{
    const product = await Product.findById(req.query.id).populate('reviews.user','name email');

    res.status(200).json({
        success: true,
        reviews: product.reviews
    })
})

exports.deleteReview = catchAsyncError(async (req, res, next) =>{
    const product = await Product.findById(req.query.productId);
    
    //filtering the reviews which does match the deleting review id
    const reviews = product.reviews.filter(review => {
       return review._id.toString() !== req.query.id.toString()
    });
    //number of reviews 
    const numOfReviews = reviews.length;

    //finding the average with the filtered reviews
    let ratings = reviews.reduce((acc, review) => {
        return review.rating + acc;
    }, 0) / reviews.length;
    ratings = isNaN(ratings)?0:ratings;

    //save the product document
    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        numOfReviews,
        ratings
    })
    res.status(200).json({
        success: true
    })


});

exports.getAdminProducts = catchAsyncError(async (req, res, next) =>{
    const products = await Product.find();
    res.status(200).send({
        success: true,
        products
    })
});
