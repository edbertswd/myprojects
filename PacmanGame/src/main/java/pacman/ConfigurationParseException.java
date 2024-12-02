package pacman;

/**
 * General exception for all configuration related errors.
 */
public class ConfigurationParseException extends RuntimeException {

    public ConfigurationParseException(String error) {
        super(error);
    }
}
