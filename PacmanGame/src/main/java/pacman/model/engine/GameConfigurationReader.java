package pacman.model.engine;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;

/**
 * Helper class to read Game Configuration from JSONObject
 */
public class GameConfigurationReader {

    private JSONObject gameConfig;

    public GameConfigurationReader(String configPath) {
        JSONParser parser = new JSONParser();

        try {
            this.gameConfig = (JSONObject) parser.parse(new FileReader(configPath));
        } catch (FileNotFoundException e) {
            System.out.println("Config file not found");
            System.exit(0);
        } catch (IOException e) {
            System.out.println("Error reading config file");
            System.exit(0);
        } catch (ParseException e) {
            System.out.println("Error parsing config file");
            System.exit(0);
        }
    }

    /**
     * Gets the path of map file
     *
     * @return path of map file
     */
    public String getMapFile() {
        return (String) gameConfig.get("map");
    }

    /**
     * Gets the number of lives of player
     *
     * @return number of lives of player
     */
    public int getNumLives() {
        return ((Number) gameConfig.get("numLives")).intValue();
    }

    /**
     * Gets JSONArray of level configurations
     *
     * @return JSONArray of level configurations
     */
    public JSONArray getLevelConfigs() {
        return (JSONArray) gameConfig.get("levels");
    }
}
