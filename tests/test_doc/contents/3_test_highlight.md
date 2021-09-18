# Test Highlight

## Without Lines
```
docker ps
```

## With Lines
```javascript-showlines
async _createTestToken(){
    const pathToken = path.normalize(path.join(this.cwd,'token.json'));
    try {
        await this._getJsonFile(pathToken);
        return;
    }
    catch(err){
        console.log('token.json is not found');
    }

    console.log('Creating a test token');
    const data = {
        "user":"test_user@example.com",
        "name":"Test User"
    }
    await this._createJsonFile(pathToken, data);
    console.log(`Successfully create ${pathToken}`);
}
```

## Without Lines
```javascript
async _createTestToken(){
    const pathToken = path.normalize(path.join(this.cwd,'token.json'));
    try {
        await this._getJsonFile(pathToken);
        return;
    }
    catch(err){
        console.log('token.json is not found');
    }

    console.log('Creating a test token');
    const data = {
        "user":"test_user@example.com",
        "name":"Test User"
    }
    await this._createJsonFile(pathToken, data);
    console.log(`Successfully create ${pathToken}`);
}
```

1. Create a REST handler `.h` file:

    ```bash
    $ cd src/framework/adminhandlers
    $ # Edit EchoHandler.h
    ```

    ```cpp-showlines

    #ifndef ECHO_HANDLER_H
    #define ECHO_HANDLER_H

    /**
     * @file
     * Defines EchoHandler, a Splunk REST handler that does `echo`.
     */

    // Splunk
    #include "AdminManager.h"

    /**
     * %EchoHandler is a REST handler that does `echo`.
     */
    class EchoHandler FINAL : public MConfigHandler {
    public:
        explicit EchoHandler( const AdminActions &requestedAction ) :
            MConfigHandler( requestedAction, eActionList, AdminManager::eContextNone )
        {
        }

    private:
        void setup() OVERRIDE;
        void handleList( ConfigInfo &confInfo ) OVERRIDE;
    };

    #endif /* ECHO_HANDLER_H */

    ```

1. Create the corresponding `.cpp` file:

    ```cpp-showlines
    #include "EchoHandler.h"
    #include "EnvironmentVariable.h"

    static Logger gLogger( "EchoHandler" );

    namespace FILE_PRIVATE {

    static Str const ARGS_MESSAGE = "message";

    } // namespace FILE_PRIVATE

    void EchoHandler::setup() {
        setReadCapability( Capability::NONE );
        _supportedArgs.addReqArg( ARGS_MESSAGE );
    }

    void EchoHandler::handleList( ConfigInfo &confInfo ) {
        USING_FILE_PRIVATE_NAMESPACE;

        Str const &message = _callerArgs.getFirstValue( ARGS_MESSAGE );
        Str const &sub = EnvironmentVariable::substitute( message );
        
        ConfigItem &echo = confInfo[ "echo" ];
        echo[ ARGS_MESSAGE ].insertStr( sub );
    }
    ```