CREATE OR REPLACE FUNCTION save_canvas_transaction(canvas_data JSONB)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  col_record JSONB;
  i INTEGER;
BEGIN
  -- Start transaction
  BEGIN
    -- Update canvas table
    INSERT INTO canvas (
      id, name, description, folder_id, user_id, updated_at
    ) VALUES (
      (canvas_data->>'id')::uuid,
      canvas_data->>'name',
      canvas_data->>'description',
      (canvas_data->>'folder_id')::uuid,
      (canvas_data->>'user_id')::uuid,
      (canvas_data->>'updated_at')::timestamp
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      folder_id = EXCLUDED.folder_id,
      updated_at = EXCLUDED.updated_at;
    
    -- Update canvas_data table
    INSERT INTO canvas_data (
      canvas_id, nodes, edges, styles, version, updated_at
    ) VALUES (
      (canvas_data->>'id')::uuid,
      canvas_data->'nodes',
      canvas_data->'edges',
      canvas_data->'styles',
      (canvas_data->>'version')::int,
      (canvas_data->>'updated_at')::timestamp
    )
    ON CONFLICT (canvas_id) DO UPDATE SET
      nodes = EXCLUDED.nodes,
      edges = EXCLUDED.edges,
      styles = EXCLUDED.styles,
      version = EXCLUDED.version,
      updated_at = EXCLUDED.updated_at;
    
    -- Insert into canvas_history table
    INSERT INTO canvas_history (
      id, canvas_id, data, version, created_at
    ) VALUES (
      (canvas_data->>'history_id')::uuid,
      (canvas_data->>'id')::uuid,
      canvas_data->'history_data',
      (canvas_data->>'version')::int,
      NOW()
    );
    
    -- Update or insert canvas_settings
    INSERT INTO canvas_settings (
      id, canvas_id, theme, grid_size, show_grid, show_rulers, snap_to_grid, table_settings, updated_at
    ) VALUES (
      gen_random_uuid(), -- Generate a UUID for the id column
      (canvas_data->>'id')::uuid,
      canvas_data->>'theme',
      COALESCE((canvas_data->>'grid_size')::int, 15),
      COALESCE((canvas_data->>'show_grid')::boolean, true),
      COALESCE((canvas_data->>'show_rulers')::boolean, false),
      COALESCE((canvas_data->>'snap_to_grid')::boolean, true),
      canvas_data->'table_settings',
      (canvas_data->>'updated_at')::timestamp
    )
    ON CONFLICT (canvas_id) DO UPDATE SET
      theme = EXCLUDED.theme,
      grid_size = EXCLUDED.grid_size,
      show_grid = EXCLUDED.show_grid,
      show_rulers = EXCLUDED.show_rulers,
      snap_to_grid = EXCLUDED.snap_to_grid,
      table_settings = EXCLUDED.table_settings,
      updated_at = EXCLUDED.updated_at;
    
    -- Delete existing column definitions and insert new ones
    DELETE FROM column_definition WHERE canvas_id = (canvas_data->>'id')::uuid;
    
    -- Insert new column definitions
    FOR i IN 0..jsonb_array_length(canvas_data->'columns')-1 LOOP
      col_record := canvas_data->'columns'->i;
      
      INSERT INTO column_definition (
        id, 
        canvas_id, 
        title, 
        type, 
        options, 
        required, 
        "order", 
        related_canvas_id, 
        rollup_column_id,
        relation_row_ids,
        created_at, 
        updated_at
      ) VALUES (
        (col_record->>'id')::uuid,
        (canvas_data->>'id')::uuid,
        col_record->>'title',
        col_record->>'type',
        CASE WHEN col_record->'options' IS NULL OR col_record->'options' = 'null' THEN NULL 
             ELSE col_record->'options' END,
        COALESCE((col_record->>'required')::boolean, false),
        (col_record->>'order')::int,
        CASE WHEN col_record->>'related_canvas_id' IS NULL OR col_record->>'related_canvas_id' = 'null' 
             THEN NULL ELSE (col_record->>'related_canvas_id')::uuid END,
        CASE WHEN col_record->>'rollup_column_id' IS NULL OR col_record->>'rollup_column_id' = 'null' 
             THEN NULL ELSE (col_record->>'rollup_column_id')::uuid END,
        CASE WHEN col_record->'relation_row_ids' IS NOT NULL AND col_record->'relation_row_ids' != 'null' 
             THEN ARRAY(SELECT jsonb_array_elements_text(col_record->'relation_row_ids'))
             ELSE NULL::text[] END,
        NOW(),
        NOW()
      );
    END LOOP;
    
    result = json_build_object('success', true)::jsonb;
    RETURN result;
  
  EXCEPTION WHEN OTHERS THEN
    -- If any error occurs, rollback the transaction
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql;