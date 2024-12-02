package pacman.model.factories;

import pacman.model.entity.Renderable;
import pacman.model.entity.dynamic.physics.Vector2D;

/**
 * Responsible for delegating createRenderable requests to the appropriate registered concrete factory.
 */
public interface RenderableFactoryRegistry {

    /**
     * Instantiates a renderable of the given type with the given position
     *
     * @param renderableType type to create
     * @param position       starting coordinate position of renderable
     */
    Renderable createRenderable(
            char renderableType,
            Vector2D position
    );

    /***
     * Adds factory to registry based on the type of renderable it creates
     * @param renderableType renderable type it creates
     * @param renderableFactory factory that creates that type of renderable
     */
    void registerFactory(char renderableType, RenderableFactory renderableFactory);
}



