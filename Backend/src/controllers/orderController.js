import orderSchema from "../models/order-model.js";
import productSchema from "../models/products-model.js";
// import shippingInSchema from "../models/shipping-info-model.js";
// import orderItemSchema from "../models/order-item-model.js";

const createOrder = async (req, res, next) => {
  try {
    const {
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    const order = await orderSchema.create({
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paidAt: Date.now(),
      user: req.user._id,
    });

    return res
      .status(201)
      .json({ success: true, message: "Order create successfully", order });
  } catch (error) {
    console.log("ERROR IN CREATE ORDER: ", error);
    return res.status(400).json({ message: "ERROR IN CREATE ORDER" });
  }
};

// Get single order
const getSingleOrder = async (req, res, next) => {
  try {
    const order = await orderSchema
      .findById(req.params.id)
      .populate("user", "username email");
    console.log("order: ", order);

    if (!order) {
      return res.status(404).json({ message: "Order not found wtih this Id" });
    }

    return res
      .status(201)
      .json({ success: true, message: "Get single order successfully", order });
  } catch (error) {
    console.log("ERROR IN GET SINGLE ORDER: ", error);
    return res.status(400).json({ message: "ERROR IN GET SINGLE ORDER" });
  }
};

// Get login user order
const myOrder = async (req, res, next) => {
  try {
    const orders = await orderSchema.find({ user: req.user._id });
    console.log("orders: ", orders);

    return res.status(201).json({
      success: true,
      message: "Get login user order successfully",
      orders,
    });
  } catch (error) {
    console.log("ERROR IN LOGIN USER: ", error);
    return res.status(400).json({ message: "ERROR IN LOGIN USER" });
  }
};

// Get all orders --Admin
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await orderSchema.find();

    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found in database" });
    }

    let totalAmount = 0;

    orders.forEach((order) => {
      totalAmount += order.totalPrice;
    });

    return res.status(201).json({
      success: true,
      message: "Get all orders sucessfully in admin",
      totalAmount,
      orders,
    });
  } catch (error) {
    console.log("ERROR IN GET ALL ORDERS: ", error);
    return res.status(400).json({ message: "ERROR IN GET ALL ORDERS" });
  }
};

// Update order status --Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderSchema.findById(req.params.id);
    console.log("update order status: ", order);

    if (!order) {
      return res.status(404).json({ message: "Order not found wtih this Id" });
    }

    //Yahan check ho raha hai ke agar order ka status already "delivered" hai, toh agay ka process
    // stop ho jaye aur response mai error message de "You have already delivered this order".
    if (order.orderStatus === "delivered") {
      return next(
        res.status(400).json({
          message: "You have already delivered this order",
        })
      );
    }

    order.orderItems.forEach(async (item) => {
      await updateStock(item.productId, item.quantity);
    });

    //Yeh line order ka status update kar rahi hai, jo req.body.status mai diya gaya hai.
    order.orderStatus = req.body.status;
    console.log("req.body.status: ", req.body.status);
    // console.log("orderStatus: ", orderStatus);

    //Agar new status "delivered" hai, toh deliveredAt field ko current time se set kiya ja raha hai.
    if (req.body.status === "delivered") {
      order.deliveredAt = Date.now();
    }

    //Yeh line updated order ko database mai save karti hai. { validateBeforeSave: false }
    // ka matlab hai ke bina validation ke save karo.
    await order.save({ validateBeforeSave: false });

    return res.status(201).json({
      success: true,
      message: "Update order status sucessfully in admin",
    });
  } catch (error) {
    console.log("ERROR IN UPDATE ORDER STATUS: ", error);
    return res.status(400).json({ message: "ERROR IN UPDATE ORDER STATUS" });
  }
};

// Update stock --Admin
async function updateStock(productId, quantity) {
  const product = await productSchema.findById(productId);
  console.log("update stock product: ", product);

  //Yeh line product ka stock kam kar rahi hai jitna quantity order mai hai.
  product.stock -= quantity;

  //Yeh updated stock ko save karta hai database mai bina validation ke.
  await product.save({ validateBeforeSave: false });
}

// Delete order --Admin
const deleteOrder = async (req, res, next) => {
  try {
    const order = await orderSchema.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found wtih this Id" });
    }

    // if (order.length === 0) {
    //   return res.status(404).json({ message: "Order not found in database" });
    // }

       // Delete the order
       await orderSchema.deleteOne({ _id: req.params.id }); // Use deleteOne with the order ID

    return res.status(201).json({
      success: true,
      message: "Order delete sucessfully in admin",
      orderSchema
    });
  } catch (error) {
    console.log("ERROR IN DELETE ORDER: ", error);
    return res.status(400).json({ message: "ERROR IN DELETE ORDER" });
  }
};

export {
  createOrder,
  getSingleOrder,
  myOrder,
  getAllOrders,
  updateOrderStatus,
  updateStock,
  deleteOrder,
};
