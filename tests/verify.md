# Test cases for Verify feature

* When verify feature is disabled, workshop service should not have unexpected errors.
* Using verify block on contents should trigger errors when building a workshop image if verify feature is not enabled.
* Ensure all parsing conditions are exercised. Parsing conditions include:
    * features.verify can be set to true if 'confirm' type is to be used
    * features.verify must contain an array property 'targets' to add a target that is not 'confirm' type
    * items within 'targets' property must be an object
    * each item within 'targets' must have
        * 'name' property
        * 'type' property. valid types are:
            * confirm
            * quiz
            * survey
            * script
    * for type 'quiz' the following additional properties should be specified:
        * 'file' property - a yaml file contains quiz descriptions
    * for type 'script' the following additional properties should be specified:
        * 'file' property - a JavaScript file that will be used for validating solutions submitted by users.