const { MongoClient } = require("mongodb");

// MongoDB connection URI
const MONGO_URI = "mongodb+srv://e-commerce:commerce@ecommercedb.2mdkg8g.mongodb.net/?retryWrites=true&w=majority&appName=EcommerceDB";
const DATABASE_NAME = "e_commerce";

exports.handler = async (event) => {
    let client;
    try {
        client = new MongoClient(MONGO_URI);
        await client.connect();
        const db = client.db(DATABASE_NAME);

        let collectionName = event.collection || (event.queryStringParameters?.collection);
        let operation = event.operation || (event.queryStringParameters?.operation) || "read";
        let collection = db.collection(collectionName);
        let response = {};

        switch (operation) {
            case "search_menu":
                response = await collection.find({}, { projection: { menu: 1, _id: 0 } }).toArray();
                break;
            case "userCheck":
                const field=event.field || "";
                const para=event.parameter || "";
                response=await collection.find({ [field]: para },{projection:{[field]:1,_id:0}}).toArray();
                break;
            case "loginUser":
                const loginmail = event.mail;
                const loginpassword = event.password;
                response = await collection.findOne(
                    { mail: loginmail, password: loginpassword },
                    { projection: { _id: 0, cart: 0, orders: 0, wishlist: 0 } }
                );
                response = response ? [response] : []; // wrap in array so frontend expects an array
                break;
            case "createUser":
                const user=event.user;
                const data={
                    "firstName":user.firstName,
                    "lastName":user.lastName,
                    "DOB":user.DOB,
                    "gender":user.gender,
                    "address":user.address,
                    "mail":user.mail,
                    "phone":user.phone,
                    "password":user.password,
                    "cart":user.cart,
                    "orders":user.orders,
                    "wishlist":user.wishlist
                };
                if (data) {
                    let result = await collection.insertOne(data);
                    response = { inserted_id: result.insertedId };
                } else {
                    response = { error: "No data provided for insertion" };
                }
                break;
            case "getFieldValues":
                const targetField =  event.field || event.fieldName;
                ;
                if (!targetField) {
                    response = { error: "Field not specified" };
                    break;
                }
                response = await collection.find({}, { projection: { [targetField]: 1, _id: 0 } }).toArray();
                break;
            case "getFieldValuesByMail":
                const targetFieldByMail = event.field || event.fieldName;
                const mailToSearch = event.mail;
                if (!targetFieldByMail || !mailToSearch) {
                    response = { error: "Both 'field' and 'mail' must be specified" };
                    break;
                }
                
                const fieldData = await collection.findOne(
                    { mail: mailToSearch },
                    { projection: { [targetFieldByMail]: 1, _id: 0 } }
                );
                
                response = fieldData ? fieldData : { message: "No data found" };
                break;
                
            case "updateField":
                const mailId = event.mail;
                const fieldName = event.field;
                const fieldValue = event.value;
                
                if (!mailId || !fieldName || typeof fieldValue === "undefined") {
                    response = { error: "Missing 'mail', 'field', or 'value'" };
                    break;
                }
                
                const updateFieldResult = await collection.updateOne(
                    { mail: mailId },
                    { $set: { [fieldName]: fieldValue } }
                );
                
                response = {
                    matchedCount: updateFieldResult.matchedCount,
                    modifiedCount: updateFieldResult.modifiedCount,
                    message: updateFieldResult.matchedCount > 0
                        ? "Field updated successfully."
                        : "User not found."
                };
               break;
               case "addProduct":
                const newProduct = event.product;
            
                if (!newProduct || typeof newProduct !== 'object') {
                    response = "Invalid or missing product data";
                    break;
                }
            
                const insertResult = await collection.insertOne(newProduct);
                response = "Product added successfully";
                break;            
        case "getProduct":
                const title = event.title || (event.queryStringParameters?.title);
            
                if (!title) {
                    response = { error: "Title not provided" };
                    break;
                }
            
                const product = await collection.findOne(
                    { title: { $regex: `^${title}$`, $options: "i" } },
                    { projection: { _id: 0 } }
                );
                // response=product;
                // break;
                if (!product) {
                    response = [];
                    break;
                }

                const category = product.category;
            
                
                const relatedProducts = await collection.find(
                    {
                        $or: [
                            { category: category },
                            { description: { $regex: title, $options: "i" } }
                        ],
                        title: { $ne: title } // optional: exclude the original product
                    },
                    { projection: { _id: 0 } }
                ).toArray();

                response = [product, ...relatedProducts];
            
                break;
                case "getSingleProduct":
                    const productTitle = event.title || (event.queryStringParameters?.title);
                
                    if (!productTitle) {
                        response = { error: "Title not provided" };
                        break;
                    }
                
                    const singleProduct = await collection.findOne(
                        { title: { $regex: `^${productTitle}$`, $options: "i" } },
                        { projection: { _id: 0 } }
                    );
                
                    response = singleProduct ? [singleProduct] : [];
                    break;                
            default:
                response = { error: "Invalid operation" };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(response),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
            },
            body: JSON.stringify({ error: error.message })
        };
    } finally {
        if (client) await client.close();
    }
};
