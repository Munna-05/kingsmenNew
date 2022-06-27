const multer=require('multer')
const path = require('path')

var storage=multer.diskStorage({
    //where to upload
    destination:function(req,file,cb){
        console.log("multerrrrrrrrrrrrrrrrrrrrrrr");
        cb(null,'public/uploads') //null: used to handle user error while uploading
    },
    //rename image to get unique name
    filename:function(req,file,cb){
        //this will return last index of'.' after into ext
        var ext=file.originalname.substring(file.originalname.lastIndexOf("."))
        cb(null,file.fieldname+'-'+Date.now()+ext)
    }

})

//set the storage configoration to know multer module about storage setting

store=multer({storage:storage})
module.exports=store;
