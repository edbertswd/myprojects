package pacman.model.entity.dynamic.ghost.State;

import javafx.scene.image.Image;
import pacman.model.entity.dynamic.ghost.GhostImpl;
import pacman.model.entity.dynamic.ghost.GhostMode;
import pacman.model.entity.dynamic.player.Pacman;
import pacman.model.entity.staticentity.collectable.Collectable;
import pacman.model.level.Level;
import pacman.model.level.LevelImpl;

public class EdibleState implements EdibleInterface {
    private LevelImpl levelImpl;


    @Override
    public void collideWithGhost(LevelImpl l, GhostImpl g) {
        System.out.println("eat me");
        l.ghostEaten(g);
    }

}